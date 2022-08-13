/**
 * ARGUMENTS
 * Catch arguments to load extra module or process a queue one by one
 * We use it to catch for example
 *  - node server install = install all
 *  - node server install:xxx = install xxx
 *  - node server test = test all
 *  - node server test:xxx = test xxx
 */

module.exports = async $wt => {

  // References.
  let subprocess = [];

  /**
   * NEXT QUEUE
   * Use to process module one by one: "install" and "test".
   * Each module should use "$wt.next" at the end of process.
   *
   * @returns {Promise<void>}
   */

  $wt.next = async () => {

    // Get file.
    let file = subprocess[0];

    // Process subqueue.
    if (file) {

      console.log("\033[90m----------------------------------------\033[0m");
      console.log("\033[35m FILE: \033[0m" + file);

      // Remove the first entry.
      subprocess = subprocess.slice(1, subprocess.length);

      // Load the module.
      let module = await require($wt.path.resolve(file) );

      // Case if function.
      if (typeof module === "function") {

        // Pass in argument the app object.
        await module($wt);

      }
    }

    // END.
    else {

      // Propagate event.
      $wt.trigger("arguments.queue.end");

      console.log("\033[90m----------------------------------------\033[0m");

      // We want to let arbitrary 'subprocess.queue.end' perform action
      setTimeout(process.exit, 3000);

    }

  };

  /**
   * CATCH EVENTS
   */

  $wt.on("ready", async () => {

    /**
     * SUB PROCESS
     * Base from arguments we can run some extra process.
     * Each of them should call $wt.next to continue otherwise
     * mean an error occur and we should stop.
     */

    // Can be improve to avoid "node install" or "node test"?
    let haveSubProcess = process.argv.filter(item => {
      return item.indexOf('install') > -1 || item.indexOf('test') > -1;
    });

    // Any install/test.
    if (haveSubProcess.length) {

      // Check only one => test:mysql
      let explode = haveSubProcess[0].split(":");
      let folder = (explode.length === 2) ? explode[1] : false;
      let processName = explode[0];

      // Extend API only when test is used to avoid heavy memory usage.
      if (processName === 'test' && !$wt.browser) {
        subprocess = subprocess.concat($wt.glob.sync([
          '**/tests/**/*.js',
          '!temp','!node_modules'
        ]));
      }

      if (folder) {
        subprocess = subprocess.concat($wt.glob.sync([
          '**/' + folder + '/' + processName + '/*.js',
          '!temp','!node_modules'
        ]));
      }
      else {
        subprocess = subprocess.concat($wt.glob.sync([
          '**/' + processName + '/*.js',
          '!temp','!node_modules'
        ]));
      }

      // Maybe there is some subprocess needed.
      if (subprocess.length) {
        setTimeout($wt.next, 125)
      }

    }

  });

};