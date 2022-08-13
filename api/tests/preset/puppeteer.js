const puppeteer = require('puppeteer');

module.exports = async $wt => {

  /**
   * JOB PROCESS
   */

  $wt.job("Puppeteer")

  /**
   * BROWSER INSTANCE
   * We create only one instance of browser
   */

  .task("Create browser instance", async () => {

    $wt.browser = await puppeteer.launch({
      headless: true
    });

    return true;

  })

  /**
   * PAGE INSTANCE
   * Only one page that can be re-use accros all tests.
   */

  .task("Create page instance", async cfg => {

    $wt.browser.page = await $wt.browser.newPage();

    return true;

  })

  /**
   * VISIT A PAGE
   * This wrapper is use to manage error.
   *
   * @param url
   * @returns {Promise<HTTPResponse>}
   */

  .task("Visit page utility", async cfg => {

    $wt.browser.page.visit = async url => {

      // enable request interception
      /*await $wt.browser.page.setRequestInterception(true);

      // add header for the navigation requests
      $wt.browser.page.on('request', request => {

        // Do nothing in case of non-navigation requests.
        if (!request.isNavigationRequest()) {
          request.continue();
          return;
        }

        // Add a new header for navigation request.
        const headers = request.headers();
        headers['Referer'] = 'http://example.com';
        request.continue({ headers });

      });*/

      return await $wt.browser.page.goto(url, {
        timeout: 0,
        waitUntil: 'networkidle0'
      }).catch(error => {
        console.log("The page url seems not reachable" + error);
        process.exit();
      });

    };

    return true;

  })

  /**
   * SCREENSHOT
   * This wrapper is use to manage error and folder path.
   * TODO: check if test folder exist first.
   *
   * @param name
   * @returns {Promise<Buffer | string | void | boolean>}
   */

  .task("Screenshot utility", async cfg => {

    $wt.browser.screenshot = async name => {
      return await $wt.browser.page.screenshot({
        path: process.env.TEMP_PATH + '/test/' + name + '.png'
      })
      .catch(() => {
        return false;
      });
    };

    return true;

  })

  .task("Network utility", async cfg => {

    /**
     * CHECK NETWORK
     * Utility to check network resource.
     *
     * @param what
     * @returns {Promise<void>}
     */

    $wt.browser.network = async what => {

      // String to array :-)
      let toCheck = (!Array.isArray(what)) ? [what] : what;

      // Convert network result array to string.
      let networks = await $wt.browser.page.evaluate(async () => {
        return performance.getEntriesByType("resource").map(resource => {
          return resource.name;
        }).join('|');
      });

      return await new Promise((resolve, reject) => {

        let found = toCheck.filter(entry => {
          return networks.indexOf(entry) > -1;
        });

        resolve(found.length === toCheck.length);

      });

    };

    return true;

  })


  /**
   * CATCH EVENTS
   */


  .task("Catch end queue process", async cfg => {

    $wt.on("arguments.queue.end", async () => {

      // Close browser instance.
      if ($wt.browser) {
        await $wt.browser.close();
      }

      // TODO: Cleanup TEMP_PATH folder
      // console.log("END PROCESS");

    });

    return true;

  })

  .execute();

};
