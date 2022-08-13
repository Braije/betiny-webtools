/**
 * ETRANS
 * Wrapper to forward request from Webtools to eTranslation service.
 * eTranslation service use SOAP approach then we need to forward the Webtools
 * POST request to SOAP service and waiting the callback response from SOAP
 * to forward the result to initial request from Webtools.
 *
 * DOC eTranslation Service.
 * https://ec.europa.eu/cefdigital/wiki/display/CEFDIGITAL/How+to+submit+a+translation+request+via+the+CEF+eTranslation+webservice
 *
 * TODO: expose received response from translation service to make it work locally.
 */

const request = require('request');
const localtunnel = require('localtunnel');

const config = require('./config/config.js');

module.exports = async $wt => {

  /**
   * TUNNELING
   * Expose received response from translation service to make it work locally.
   * TODO: apply only for local test :p
   */

  const tunnel = await localtunnel({
    port: process.env.HTTP_PORT,
    subdomain: "mylocalhost"
  });

  process.env.PUBLIC_URL = process.env.PUBLIC_URL || tunnel.url;

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

  $wt.route.form("/webtools/rest/etrans/translate", async (req, res) => {

    // References.
    let id = req.query.id || $wt.id();
    let now = Date.now();
    let referer = req.headers.referer || req.headers.referrer || null;

    /**
     * EVENT LISTENER
     * Wait until we received feedback from "collector".
     */

    $wt.once("etrans.feedback." + id, params => {

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

  $wt.route.form("/webtools/rest/etrans/collector", async (req, res) => {

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
      $wt.trigger("etrans.feedback." + params.id, params);

    });

    // Reply faster.
    res.status(200).send("ok");

  });

  /**
   * DEMO
   */

  $wt.route.static("/webtools/demo/etrans", __dirname + "/demo");

  /**
   * CATCH EVENTS
   */

  $wt.on('ready', () => {

    // Drop message.
    console.log("\033[32m DEMO - ETRANS:\033[0m \t", process.env.HTTP_FULLPATH + "/webtools/demo/etrans");

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
          httpDestinations: [tunnel.url + "/webtools/rest/etrans/collector?id=" + $wt.id()]
        }

      },

      auth: {
        user: process.env.ETRANS_USER,
        pass: process.env.ETRANS_PASSWORD,
        sendImmediately: false
      }

    }, (error, response, body) => {

      let responseFrom = response.toJSON();

      // ERROR
      if (parseInt(body) < 0) {
        console.log(config.error[body]);
      }
      else {

      }

    });

  });

};
