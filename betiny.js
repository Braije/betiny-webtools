/**
 * BeTiny v1.0 - Tiny engine | Author: Braije Christophe 2019
 */

// Native modules.
const glob = require('fast-glob');
const path = require('path');
const events = require('events');

/**
 * CONFIG
 * We use only one central config file.
 * Populate global "process.env.XXX" with ".env" file properties.
 * - You should see the "process.env" like a super global
 * - "process.env" is available in any script or subscript
 */

require('dotenv').config({
  path: './.env'
});

/**
 * LOADER API
 * It's the main file to start any kind of services.
 * You can drop some feature at start for each process
 * or sub-process.
 *
 * HOW TO
 * require('@betiny')( OPTIONS = {
 *
 *    middelware: false,  // Load middelware
      app: false          // Load app

 * }, FUNCTION = $wt => {...});
 *
 */

module.exports = async (...args) => {

  /**
   * MANAGE ARGUMENTS
   * Allow you to load or not some features.
   */

  let callback = false;
  let parameters = {
    api: true,
    middelware: false,
    app: false
  };

  if (typeof args[0] === 'function') {
    callback = args[0];
  }
  else if (typeof args[1] === 'function' && typeof args[0] === 'object') {
    parameters = Object.assign(parameters, args[0]);
    callback = args[1];
  }
  else {
    console.log("Betiny: wrong arguments!");
    process.exit();
  }

  /**
   * EVENTS
   */

  // Create an eventEmitter object reference.
  let event = new events.EventEmitter();

  // Use for internal usage.
  const eventsRec = (name, type) => {

    $wt.config.events = $wt.config.events || [];

    let exists = false;

    $wt.config.events = $wt.config.events.map(node => {
      if (node && node.name === name && node.type === type) {
        exists = true;
        node.count = node.count + 1;
      }
      return node;
    });

    if (!exists) {
      $wt.config.events.push({
        name: name,
        type: type,
        count: 1
      });
    }

  };

  /**
   * MAIN OBJECT API.
   * Basic main mandatory method or objects reference.
   */

  let $wt = {

    /**
     * TRIVIAL EXTEND API
     */

    extend: obj => {
      for (var i in obj) {
        $wt[i] = obj[i];
      }
    },

    /**
     * EVENTS COLLECTION
     * Use native module of node.js.
     */

    trigger: (name, params) => {
      event.emit(name, params);
      eventsRec(name, "trigger");
    },

    on: (name, callback) => {
      event.addListener(name, callback);
      eventsRec(name, "on");
    },

    off: (name, callback) => {
      event.removeListener(name, callback);
      eventsRec(name, "off");
    },

    once: (name, callback) => {
      event.once(name, callback);
      eventsRec(name, "once");
    },

    /**
     * ALIAS
     */

    path: path,
    glob: glob,

    /**
     * CONFIG
     * Config sharing between all API.
     */

    config: {},

    // Process collection.
    process: {},

    // Database collection.
    db: {},

    // Routes collection.
    route: {},

    // Middleware collection.
    middleware: {},

    // Template collection.
    template: {},

    // Utils collection.
    utils: {}

  };

  /**
   * MAIN PROCESS
   * - api = generic method sharing between process
   * - middelware = extra route process using api or not
   * - app = main app/services using both "api" and "middelware"
   */

  // 1 - Populate API.
  let queue = $wt.glob.sync(['./api/*.js', './api/*/*.js'], {deep: 2});

  // 2 - Run all init first to populate config or set any middleware.
  if (parameters.middelware) {
    queue = queue.concat($wt.glob.sync(['./middelware/*/*.js'], {deep: 2}));
  }

  // 3 - App
  if (parameters.app) {
    queue = queue.concat($wt.glob.sync(['./app/*/*.js'], {deep: 2}));
  }

  /**
   * TRIVIAL MESSAGE
   */

  console.log("\033[90m----------------------------------------\033[0m");
  console.log(" BETINY START:", process.pid);
  console.log("\033[90m----------------------------------------\033[0m");

  /**
   * DISCOVERY PROCESS OF EACH NECESSARY FILES
   * We loop over each files and forward the $wt object.
   *
   * @param params {object}
   * @returns {Promise<void>}
   */

  const load = async (params = {}) => {

    // Drop a message.
    if (params.message) {
      process.stdout.cursorTo(0);
      process.stdout.clearLine();
      process.stdout.write("\033[33m LOAD:\033[0m " + params.message);
    }

    // The file to be load.
    let file = queue[0];

    // Process queue.
    if (file) {

      // Remove the first entry.
      queue = queue.slice(1, queue.length);

      // Load the module.
      let module = await require($wt.path.resolve(file));

      // Case if function.
      if (typeof module === "function") {

        // Pass in argument the app object.
        await module($wt)

      }

      load({
        message: file
      });

    }

    // Queue end.
    else {

      // Remove previous message.
      process.stdout.cursorTo(0);
      process.stdout.clearLine();

      // Otherwise continue process.
      if (callback) {
        await callback($wt);
      }

      // Propagate events ready (ex: drop message).
      setTimeout(() => {

        console.log("\033[90m----------------------------------------\033[0m");

        $wt.trigger('ready');

      }, 125);

    }

  };

  load();

};
