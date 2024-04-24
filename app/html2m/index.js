/**
 * HTML2M
 */

const $ = require('betiny-core');

// Basis.
const fs = require("fs");
const url = require("url");
const puppeteer = require("puppeteer");

// Custom config.
const config = require('./config.js');

/**
 * DELETE FILES
 * Delete files based on date creation properties.
 *
 * TODO: Re-usable method to delete files based on folder and date range
 * TODO: Manage folder start with or without / at start
 * TODO: Manage the "/" of folder at the end
 * TODO: Manage Number value of days parameters etc..
 */

const cleanUpFilesInFolder = (config = {}) => {

  let params = { ...{
    folder: "temp/html2m/",
    days: 1,
    hours: 1,
    mins: 1,
    secs: 1
  }, ...config};

  // Where.
  let html2mRead = $.file.read(params.folder);

  // Filter by date.
  html2mRead.files.filter(file => {
    let { creation } = $.file.stats(params.folder + file);
    let range = (1 * 24 * 60 * 60 * 1000);
    let diff = (new Date() - creation);
    let shouldBeDelete = (range < diff);
    return (range < diff && (diff > 1000)) ;

  // Delete.
  }).map(file => {
    console.log(
      $.draw()
        .space(1)
        .background("red").color("white").text(' CLEANUP ').reset()
        .space(2).text(file)
        .finish()
    );
    $.file.delete(params.folder + file);
  });

};

// setTimeout(cleanUpFilesInFolder, 2000);

/**
 * CONVERT (POST)
 */

$.route.post("/rest/html2m/convert", async (req, res) => {

  /**
   * BODY ARGUMENTS
   *  - 1 = URL address || HTML
   *  - 2 = output_format
   *  - 3 = orientation
   *  - 4 = format
   *  - 5 = load delay
   *  - 6 = background
   *  - 7 = margin
   *  - 8 = load_delay
   */

  const query = req.body;

  /**
   * REFERENCES.
   */

  let urlAddress = "";
  let inputName;
  let observer;
  let isReady;
  let timer;
  let count = 0;

  /**
   * Validate URL || HTML.
   */

  if (!query.url && !query.html) {
    res.status(400).send({
      wtstatus: {
        success: 0,
        status: "Url or HTML mandatory parameter not specified."
      }
    });
    return;
  }

  /**
   * Validate output_format parameter
   */

  let outputFormat = config.defaultScreenShotExtension;
  if (query.output_format) {

    outputFormat = query.output_format;

    if (config.allowedExtensions.indexOf(outputFormat) === -1) {

      res.status(400).send({
        wtstatus: {
          success: 0,
          status: 'Unsupported extensions '
            + outputFormat
            + '. Only '
            + config.allowedExtensions.join(' ')
            + ' are allowed.'
        }
      })

    }
  }

  /**
   * Determine screenshot type. Only used for screenshot.
   */

  let outputType = outputFormat === "jpg" ? "jpeg" : outputFormat;

  /**
   * Validate format or set default.
   */

  let format = config.defaultPaperSize;
  if (query.format) {
    if (config.allowedFormats.indexOf(query.format) !== -1) {
      format = query.format;
    }
  }

  /**
   * Validate orientation or set default.
   */

  let landscape = config.defaultLandscape;
  if (query.orientation) {
    if (
      config.allowedOrientation.indexOf(query.orientation) !== -1 &&
      query.orientation === "landscape"
    ) {
      landscape = true;
    }
  }

  /**
   * Validate load delay or set default.
   */

  let loadDelay = config.defaultLoadDelay;
  if (query.load_delay) {
    loadDelay = query.load_delay;
  }

  /**
   * Validate background.
   */

  let background = config.defaultBackground;
  if (query.background) {
    if (query.background === "false") {
      background = false;
    }
  }

  /**
   * Validate margin.
   */

  let margin = config.defaultMargin;
  if (query.margin && parseInt(query.margin) < 350) {
    margin = {
      top: query.margin,
      right: query.margin,
      bottom: query.margin,
      left: query.margin
    }
  }

  /**
   * AS URL.
   */

  if (query.url) {

    urlAddress = query.url;

    const parsedUrl = url.parse(urlAddress);

    if (!parsedUrl.hostname) {
      res.status(400).send({
        wtstatus: {
          success: 0,
          status: "Invalid URL " + urlAddress + " parameter."
        }
      });
      return
    }

  }

  /**
   * AS HTML
   * - First write content provide by user.
   */

  else if (query.html) {

    let data = query.html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,'')
      .replace(/(\b)(on\S+)(\s*)=|javascript:|(<\s*)(\/*)script/ig, '');

    // Generate the html page.
    inputName = "html2m_" + $.id() + ".html";

    // Write it.
    await fs.writeFile(config.folder + '/' + inputName, data, err => {
      if (err) {
        res.status(400).send({
          wtstatus: {
            success: 0,
            status: "Couldn't create html file. " + err.toString()
          }
        })
      }
    });

    // Define the path to grap it.
    urlAddress = $.server.url("/rest/html2m/output/" + inputName);

  }

  /**
   * Pdf / Screenshot implementation.
   */

  const browserArgs = [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--headless",
    "--disable-gpu"
  ];

  if ( $.env("PROXY", 0) === "1") {
    browserArgs.push("--proxy-server=" + $.env('PROXY_HOST') );
  }

  console.log(
    $.draw()
      .space(1).background("green")
      .color("black").text(" HTML2M ").reset()
      .space(1).icon("top")
      .text("\n").space(10).icon("child").space(1).text("REQUEST")
      .reset().finish()
  );

  /**
   * RUN PUPETTEER.
   */

  const browser = await puppeteer.launch({
    executablePath: config.browserPath,
    args: browserArgs,
    ignoreHTTPSErrors: true,
    headless: "new"
    // Give details about what's happen in the browser page.
    //, dumpio: true
  });

  const terminate = async () => {
    if (browser && browser.process() != null) {
      browser.process().kill('SIGINT');
    }
  }

  const page = await browser.newPage();

  // Disable Javascript.
  //if (query.html) {
    // page.setJavaScriptEnabled(false);
  //}

  if ($.env("PROXY", 0) === "1") {
    await page.authenticate({
      username: $.env("PROXY_USER"),
      password: $.env("PROXY_PASSWORD")
    })
  }

  // Set view port size.
  await page.setViewport({
    width: config.screenWidth,
    height: config.screenHeight
  });

  // Load page into browser.
  await page.goto(urlAddress);

  console.log(
    $.draw()
      .space(10).icon("pipe").space(1).color("cyan")
      .space(1).underline().text(urlAddress).reset()
      .reset()
      .text("\n").space(10).icon("pipe")
      .finish()
  );

  // Manage lazy loading image.
  await page.evaluate(() => {

    // Reflow any lazy loading image.
    [].forEach.call(document.querySelectorAll('img[loading="lazy"]'), img => {
        img.removeAttribute("loading");
        img.src = img.src;
    });

  });

  const fallback = setTimeout(async () => {

    await terminate();

    res.status(500).send({
      wtstatus: {
        success: 0,
        status: "Timeout"
      }
    })

  }, 15000);

  const check = (tmp = 3000) => {

    clearTimeout(timer);

    if (isReady) {
      return;
    }

    process.stdout.write(
      $.draw()
        .space(10).icon("child").space(1)
          .text("WAIT").space(1).color("yellow")
          .text(count++).text("\r").reset().finish()
    );

    timer = setTimeout(() => {
      isReady = true;
      $.fire("isIdle");
    }, tmp);

  };

  const screenshot = async () => {

    console.log(
      $.draw()
        .text("\n").space(10).icon("pipe")
        .text("\n").space(10).icon("child")
        .space(1).text("SCREENSHOT")
        .reset().finish()
    );

    // Remove event listener from process.
    $.off("isIdle", screenshot);

    // Remove fallback.
    clearTimeout(fallback);

    // Implement print to pdf if output extension is pdf.
    await page.waitForTimeout(parseInt(loadDelay));

    let outputFileName = "html2m_" + $.id() + "." + outputType;

    let options = {
      path: config.folder + '/' + outputFileName,
      landscape: landscape,
      format: format,
      printBackground: background,
      margin: margin
    };

    /**
     * HEADER AND FOOTER
     */

    if (query.header_footer === 'true') {

      let header = `
        <div class="content" style="font-size: 10px; width: 100%; display: inline-block; margin: 0px 15px;">
            <span class="date" style="float: left"></span>
            <span class="title" style="float: right"></span>
        </div>
      `;
      let footer = `
        <div class="content" style="font-size: 10px; width: 100%; display: inline-block; margin: 0px 15px;">
          <span class="url" style="float: left"></span>
          <span class="pageNumber" style="float: right"></span>
        </div>
      `;

      options = { ...options, ...{
        displayHeaderFooter: true,
        headerTemplate: header,
        footerTemplate: footer,
        margin: {
          top: '40px',
          bottom: '40px',
        }
      }};

    }

    /**
     * TO PDF
     */

    if (outputType === "pdf") {

      await page.pdf(options).catch(async () => {

        await terminate();

        res.status(500).send({
          wtstatus: {
            success: 0,
            status: "PDF error"
          }
        });

      })

    }

    /**
     * TO IMAGE
     */

    else {

      const screenshotOptions = {
        path: config.folder + '/' + outputFileName,
        fullPage: true,
        type: outputType,
        omitBackground: !background
      };

      // Add image quality if the requested file format is .jpg.
      if (outputType === "jpg") {
        screenshotOptions.quality = config.imageQuality;
      }

      // Print screen.
      await page.screenshot(screenshotOptions).catch( error => {

        res.status(500).send({
          wtstatus: {
            success: 0,
            status: "Screenshot error"
          }
        })

      })

    }

    console.log(
      $.draw()
        .space(10).icon("pipe").space(1).color("cyan")
        .space(1).underline().text($.server.url("/rest/html2m/output/" + outputFileName)).reset()
        .text("\n").space(10).icon("pipe").space(1)
        .text("\n").space(10).icon("end").space(1).text("DONE")
        .text("\n").reset().finish()
    );

    // Auto-cleanup old files
    cleanUpFilesInFolder({
      folder: "temp/html2m/"
    });

    await terminate();

    // Response.
    res.send({
      wtstatus: {
        success: 1,
        status: "JSON retrieved successfully",
        output: $.server.url("/rest/html2m/output/" + outputFileName)
      }
    });

  };

  // Inject method to check if dom is still changed.
  await page.exposeFunction('checkDom', () => check(2000));

  // Wait until all is ok.
  await page.evaluate(() => {
    // Create an observer instance linked to the callback function.
    observer = new MutationObserver(checkDom);

    // Start observing the target node for configured mutations.
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
  });

  // When is idle, we can make a screenshot.
  $.on("isIdle", screenshot);

  // Survey all network request.
  await page.on('request', () => check(3000));

  // Fallback for static page.
  check(1000);

});

/**
 * Get output.
 */

$.route.get("/rest/html2m/output/*", (req, res) => {

  let file = config.folder + '/' + req.params[0];

  if (fs.existsSync(file)) {
    res.status(200).sendFile(file);
  }
  else {
    res.status(404).send("File not found.");
  }

});

/**
 * DEMO
 */

$.route.static("/demo/html2m", __dirname + "/demo");

/**
 * EVENTS CATCHER
 */

$.on("betiny:server:start", async () => {

  /**
   * Check if folder exist and writable?
   * Create store path.
   */

  try {
    await fs.mkdirSync(config.folder, {
      recursive: true
    });
  }
  catch (error) {
    $.log("HTML2M", "Your html2m folder was not created.");
    process.exit();
  }

});

/**
 * DROP MESSAGE INFO
 */

$.on("ready", () => {

  console.log(
    $.draw()
      .space(1).background("blue")
      .color("black").text(" HTML2M ").reset()
      .space(1).icon("top").text("  DEMO")
      .text("\n").space(10).icon("end").space(1).color("cyan").underline().text($.server.url('/demo/html2m'))
      .text("\n").reset()
      .finish()
  );

});