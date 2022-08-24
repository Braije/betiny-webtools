/**
 * HTML2M
 */

const $ = require('betiny-core');

// TODO: Move to central API?
const fs = require("fs");
const url = require("url");

// ...
const puppeteer = require("puppeteer");

// Custom config.
const config = require('./config.js');

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

    let data = query.html;

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

  /**
   * RUN PUPETTEER.
   */

  const browser = await puppeteer.launch({
    executablePath: config.browserPath,
    args: browserArgs,
    ignoreHTTPSErrors: true
  });

  const page = await browser.newPage();

  // Disable Javascript.
  if (query.html) {
    page.setJavaScriptEnabled(false);
  }

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
  await page.goto(urlAddress, {
    waitUntil: "networkidle0"
  });

  // Implement print to pdf if output extension is pdf.
  await page.waitForTimeout(parseInt(loadDelay));

  let outputFileName = "html2m_" + $.id() + "." + outputType;

  if (outputType === "pdf") {

    await page.pdf({
      path: config.folder + '/' + outputFileName,
      landscape: landscape,
      format: format,
      printBackground: background,
      margin: margin
    })
    .catch( () => {
      res.status(500).send({
        wtstatus: {
          success: 0,
          status: "PDF error"
        }
      })
    })

  }

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
      browser.close();
      res.status(500).send({
        wtstatus: {
          success: 0,
          status: "Screenshot error"
        }
      })
    })

  }

  await browser.close();

  res.send({
    wtstatus: {
      success: 1,
      status: "JSON retrieved successfully",
      output: $.server.url("/rest/html2m/output/" + outputFileName)
    }
  })

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
    $.log.error("HTML2M", "Your html2m folder was not created.");
    process.exit();
  }

  /**
   * TAKE ADVANTAGE TO CLEAN UP CACHE FOLDER
   */

  /* TODO: Centralize auto clean up or cron process.
  $.cleanFolder(config.folder, {
    days: config.filesDeletionAge
  });
  /* */

  /**
   * DROP MESSAGE INFO
   */

  $.log.info("DEMO HTML2M", $.server.url('/demo/html2m') );

});
