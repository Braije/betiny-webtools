/**
 * MAIN WRAPPER OF ROUTES
 * - page (GET)
 * - rest (GET)
 * - form (POST)
 * - socket (TODO)
 */

const compression = require('compression');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const https = require('https');
const fs = require('fs');

module.exports = $wt => {

  /**
   * ROUTE ENGINE
   */

  const engine = express();

  /**
   * BASIC SETUP - Middleware.
   * - middleware and basic configuration for any routes.
   */

  engine

    // HTTP header.
    .set('trust proxy', 1)
    .set('etag', false)
    .disable('x-powered-by')

    // Header compression.
    .use(compression())

    // Header security.
    .use(helmet())

    // Express.
    .use(express.json({ limit: '10MB', extended: true }))

    // For parsing application/x-www-form-urlencoded.
    .use(express.urlencoded({ limit: '10MB', extended: true }))

    // Cookie session
    .use(session({
      name: process.env.SESSION_NAME,
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: false,
        maxAge: 3600*60*24
      }
    }));

  /**
   * Register reference API by name.
   */

  $wt.route.express = engine;

  /**
   * HTTPS
   * TODO: Manage this as an option from env?
   */
  /*const server = https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
  }, engine).listen(3001);*/

  /**
   * STATIC
   * Allow you to specify static data.
   *
   * @param args
   */

  $wt.route.static = (...args) => {
    if (args.length === 2) {
      engine.use(args[0], express.static(args[1]));
    }
    else {
      express.static(args[0]);
    }
  };

  /**
   * CUSTOM SETUP - Middleware.
   * Apply any other middleware setup by any modules.
   */

  let priority = [];

  const middelware = params => {

    let priorityOrder = [

      // Over the top.
      (req, res, next) => {
        req.config = params;
        next();
      }

    ];

    priority.forEach(item => {
      priorityOrder.push(item.fnc);
    });

    return priorityOrder;

  };

  $wt.route.middelware = {

    // For debug purpose.
    list: () => {
      let temp = {};
      priority.forEach( (item, index) => {
        temp[index] = {
          name: item.name,
          fnc: item.fnc
        }
      });
      return temp;
    },

    /**
     * Allow you to add middelware by priority order.
     *
     * @param name
     * @param weight
     * @param fnc
     */

    add: (name, weight, fnc) => {
      if (name && weight && fnc) {
        priority[weight] = {
          fnc: fnc,
          name: name,
          priority: weight
        };
      }
    }

  };

  /**
   * ROUTE
   * Main wrapper of GET/POST.
   *
   * @param params
   */

  const route = params => {

    let isObject = (typeof params.config === "object");
    let updateConfig = (isObject) ? params.config : {};
    let realCallback = (isObject) ? params.callback : params.config;

    let wrapper = (req, res, next) => {
      req.type = params.type;
      req.method = params.method;
      realCallback(req, res, next);
    };

    if (params.type === "rest" || params.type === "form") {
      updateConfig.login = false;
    }

    return engine[params.method](params.path, middelware(updateConfig), wrapper);

  };

  /**
   * ROUTE START
   * Should be run at the end of process loading (see server.js)
   *
   * @param callback
   */

  $wt.route.start = callback => {
    engine.listen(process.env.SERVER_PORT, callback);
  };

  /**
   * PAGE
   * Should be use for any kind of rendering page using HTML.
   *
   * @param path
   * @param config
   * @param callback
   */

  $wt.route.page = (path, config, callback) => {
    return route({
      path: path,
      config: config,
      callback: callback,
      type: "page",
      method: "get"
    })
  };

  /**
   * REST
   * Should be use for any kind of rest api returning JSON.
   *
   * @param path
   * @param config
   * @param callback
   */

  $wt.route.rest = (path, config, callback) => {
    return route({
      path: path,
      config: config,
      callback: callback,
      type: "rest",
      method: "get"
    })
  };

  /**
   * FORM
   * Should be use to POST any data.
   *
   * @param path
   * @param config
   * @param callback
   */

  $wt.route.form = (path, config, callback) => {
    return route({
      path: path,
      config: config,
      callback: callback,
      type: "form",
      method: "post"
    })
  };

  /**
   * FILE
   * Should be use for any kind of request files.
   *
   * @param path
   * @param config
   * @param callback
   */

  $wt.route.file = (path, config, callback) => {
    return route({
      path: path,
      config: config,
      callback: callback,
      type: "file",
      method: "get"
    })
  };

};
