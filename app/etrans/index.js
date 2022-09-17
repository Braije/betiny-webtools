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

  /**
   * TUNNELING
   * Expose received response from translation service to make it work locally.
   * TODO: apply only for local test :p
   */

  const tunnel = localtunnel({
    port: process.env.HTTP_PORT,
    subdomain: "mylocalhost"
  });

  process.env.PUBLIC_URL = $.server.url() || tunnel.url;

  // References.
  let timer = {};

  /**
   * LOG STATS
   * Record to database for stats.
   */

  const log = params => {
    params.end = Date.now();
    params.time = Number(params.end) - Number(params.now);
    //console.log("LOG:", params);
  };

  /**
   * REQUEST TRANSLATION
   */

  $.route.post("/rest/etrans/translate", async (req, res) => {

    // References.
    let id = req.query.id || $wt.id();
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

      url: process.env.ETRANS_URL,

      json: true,

      body: {

        sourceLanguage: req.body.sourceLanguage,
        targetLanguages: [req.body.targetLanguage],
        domain: req.body.domain || "SPD", // GEN

        callerInformation: {
          application: 'DIGIT_D1_Webttools_EUWidg_20200612',
          username: 'Webtools'
        },

        documentToTranslateBase64: {
          content: Buffer.from(req.body.textToTranslate).toString('base64'),
          format: "html"
        },

        destinations: {
          httpDestinations: [tunnel.url + "/webtools/rest/etrans/collector?id=" + id]
        }

      },

      auth: {
        user: process.env.ETRANS_USER,
        pass: process.env.ETRANS_PASSWORD,
        sendImmediately: false
      }

    }, (error, response, body) => {

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

        }, 10000);

      }

    });

  });

  /**
   * RECEIVED TRANSLATION
   */

  $.route.post("/rest/etrans/collector", async (req, res) => {

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

  $.on('ready', () => {

    console.log(
      $.draw()
        .space(1).background("yellow").text(" ETRANS ").reset()
        .space(1).icon("top").text("  DEMO")
        .text("\n").space(10).icon("end").space(1).color("cyan").underline().text($.server.url('/demo/etrans'))
        .text("\n").reset()
        .finish()  
    );

    return;
    
    request.post({

      url: process.env.ETRANS_URL,

      json: true,

      body: {

        sourceLanguage: "en",
        targetLanguages: ["fr"],
        domain: "SPD", // GEN

        callerInformation: {
          application: 'DIGIT_D1_Webttools_EUWidg_20200612',
          username: 'Webtools'
        },

        documentToTranslateBase64: {
          content: Buffer.from("<p>Happy new year!</p>").toString('base64'),
          format: "html"
        },

        destinations: {
          httpDestinations: [tunnel.url + "/webtools/rest/etrans/collector?id=" + $.id()]
        }

      },

      auth: {
        user: process.env.ETRANS_USER,
        pass: process.env.ETRANS_PASSWORD,
        sendImmediately: false
      }

    }, (error, response, body) => {

      if (error) {
        console.log("ERROR", error.message);
        return;
      }

      let responseFrom = response.toJSON();

      // ERROR
      if (parseInt(body) < 0) {
        console.log(config.error[body]);
      }
      else {

      }

    });

  });
