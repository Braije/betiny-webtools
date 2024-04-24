/**
 * ETRANS
 * Wrapper to forward request from Webtools to eTranslation service.
 * eTranslation service use SOAP approach then we need to forward the Webtools
 * POST request to SOAP service and waiting the callback response from SOAP
 * to forward the result to initial request from Webtools.
 *
 * DOC eTranslation Service.
 * https://ec.europa.eu/cefdigital/wiki/display/CEFDIGITAL/How+to+submit+a+translation+request+via+the+CEF+eTranslation+webservice
 */

const $ = require('betiny-core');

// TODO: REMOVE
const request = require('request');
const localtunnel = require('localtunnel');

const config = require('./config/config.js');

// References.
let timer = {}; 
let tunnelling = $.server.url();

/**
 * LOG STATS
 * Record to database for stats.
 */

const log = params => {
  params.end = Date.now();
  params.time = Number(params.end) - Number(params.now);
  // console.log("LOG:", params);
};

/**
 * REQUEST TRANSLATION
 */

$.route.post("/rest/etrans/translate", async (req, res) => {

  // References.
  let id = req.query.id || $.id();
  let now = Date.now();
  let referer = req.headers.referer || req.headers.referrer || null;

  /**
   * EVENT LISTENER
   * Wait until we received feedback from "collector".
   */

  $.once("etrans.feedback." + id, params => {

    // id: req.query.id,
    // data: data,
    // "request-id": req.query["request-id"],
    // "target-language": req.query["target-language"]

    // Response from SOAP take too much time.
    if (!timer[params.id]) {

      // TODO: but it was success then store somewhere?
      return;
    }

    // Clear fallback timer.
    clearTimeout(timer[params.id]);

    // Format feedback result to client.
    params.translation = params.data; //Buffer.from(params.data, 'base64').toString();

    // Log
    log({
      now: now,
      status: "success",
      referer: referer
    });

    // Forward to user.
    res.status(200).send(params);

  });

  /**
   * FORWARD REQUEST
   */

  request.post({

    url: $.env("ETRANS_URL2"),

    json: true,

    body: {

      sourceLanguage: req.body.sourceLanguage,
      targetLanguages: [req.body.targetLanguage],
      domain: req.body.domain || "gen", // GEN
      user: $.env("ETRANS_USER"),
      textToTranslate: Buffer.from(req.body.textToTranslate).toString('base64'),
      collectorUrl: tunnelling + "/rest/etrans/collector?id=" + id,

      callerInformation: {
        application: 'DIGIT_D1_Webttools_EUWidg_20200612',
        username: 'Webtools'
      },

      documentToTranslateBase64: {
        content: Buffer.from(req.body.textToTranslate).toString('base64'),
        format: "html"
      },

      destinations: {
        httpDestinations: [tunnelling + "/rest/etrans/collector?id=" + id]
      }

    },

    auth: {
      user: $.env("ETRANS_USER"),
      pass: $.env("ETRANS_PASSWORD"),
      sendImmediately: false
    }

  }, (error, response, body) => {

    if (error) {
      console.log("ERROR", error);
    }

    // ERROR "-xxxx".
    if (parseInt(body) < 0) {

      // Log
      log({
        now: now,
        status: "error",
        referer: referer,
        error: config.error[body]
      });

      // Drop error request.
      res.status(200).send({
        message: "Etrans service is not available, try later.",
        error: config.error[body]
      });

    }

    // Fallback if request take to much time.
    else {

      timer[id] = setTimeout(() => {

        // Memory cleanup.
        delete timer[id];

        // Log.
        log({
          now: now,
          status: "timeout",
          referer: referer
        });

        // Drop timeout message.
        res.status(200).send({
          message: "Timeout",
          id: id
        }).end();

      }, 5000);

    }

  });

});

/**
 * RECEIVED TRANSLATION
 */

$.route.post("/rest/etrans/collector", async (req, res) => {

  console.log("collect");

  res.header("Access-Control-Allow-Origin", "*");

  let data = [];

  // Stream aggregation data.
  req.on("data", chunk => data.push(chunk));

  // Data fully received.
  req.on("end", () => {

    // Decode data.
    data = Buffer.concat(data).toString('utf8');

    // Adapt response.
    let params = {
      id: req.query.id,
      data: data,
      "request-id": req.query["request-id"],
      "target-language": req.query["target-language"]
    };

    // Propagate events.
    $.trigger("etrans.feedback." + params.id, params);

  });

  // Reply faster.
  res.status(200).send("ok");

});

/**
 * DEMO
 */

$.route.static("/demo/etrans", __dirname + "/demo");

/**
 * CATCH EVENTS
 */

$.on('ready', async () => {

  /*
  const DigestClient = require('digest-fetch');
  const client = new DigestClient($.env("ETRANS_USER"), $.env("ETRANS_PASSWORD"));
  let responsePromise = client.fetch($.env("ETRANS_URL"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sourceLanguage: "en",
      targetLanguages: "fr",
      domain: "gen", 
      externalReference: "https//europa.eu",
      callerInformation: {
        application: 'DIGIT_D1_Webttools_EUWidg_20200612',
        username: 'Webtools'
      },
      documentToTranslateBase64: {
        content: Buffer.from("Hello").toString('base64'),
        format: "html"
      },
      destinations: {
        httpDestinations: [tunnelling + "/rest/etrans/collector?id=toto"]
      }
    })
    
  });
  let response = await responsePromise;
  if (response === 'undefined') {
    console.log('No response received from eTranslation');
  }
  if (response.status !== 200) {
    console.log("Translation response with status code " + response.status);
  }

  let responseBody = await response.text();

  console.log("\n\n", responseBody);
*/

  let dev = $.env("MODE");
  let isDev = dev === "dev";

  /*
  if (isDev) {

    // https://betiny.loca.lt
    const tunnel = await localtunnel({ 
      subdomain: "betiny",
      port: 3001,
      local_https: false,
      allow_invalid_cert: true,
      local_host: "betiny.localhost"
    });

    tunnel.on('error', (e) => {
      console.log("tunnel error", e);
    }); 

    tunnel.on('close', () => {
      console.log("tunnel Close");
    });  

    tunnelling = tunnel.url;

  }
  */

  /**
   * DROP CONSOLE INFO
   */
      
  console.log( 
    $.draw()
      .space(1).background("yellow")
      .color("black").text(" ETRANS ").reset()
      .text("\n\n")
      .space(4).text("DEMO")
      .text("\n").space(4).color("cyan").underline().text($.server.url('/demo/etrans'))
      .reset()
      .text("\n")
    .finish()  
  );

  /*
  if (isDev) {
    console.log( 
      $.draw()
        .space(10).icon("pipe")
        .text("\n").space(10).icon("child").text(" TUNNEL ").color("gray").text("DEV ONLY")
        .text("\n").space(10).icon("end").space(1).color("cyan").underline().text(tunnelling).reset()
        .text("\n").reset()
      .finish()  
    );
  } */

  console.log(); 

});
