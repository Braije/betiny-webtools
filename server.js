/**
 * BASE ARCHITECTURE SERVER (POC) - Braije Christophe - July 2019
 */

console.clear();

/**
 * BETINY API
 */

require('./betiny')({

  middelware: true,
  app: true

}, async $wt => {

  // ROOT
  $wt.route.page("/", (req, res) => {
    res.send("Betiny ready");
  });

  // Start the server.
  // TODO: review notation.
  $wt.route.express.listen(process.env.HTTP_PORT, () => {

    // When ready drop a message.
    console.log("\033[32m SERVER LOCAL:\033[0m \t\t", process.env.HTTP_FULLPATH);

    /**
     * 404
     * - Adapt the response depending of the url request.
     * - This should be place always at the end of any route.
     * TODO: Allow from API to setup and "end middelware"?
     */

    $wt.route.express.use((req, res) => {

      // Original request url / path.
      let url = req.originalUrl;

      // Javascript.
      if (url.indexOf(".js") !== -1) {
        res.setHeader('Content-Type', 'application/javascript');
        res.send('console.log("File not found: ' + url + '");');
      }

      // Stylesheet.
      else if (url.indexOf(".css") !== -1 ) {
        res.setHeader('Content-Type', 'text/css');
        res.send('/!* File not found: ' + url + ' *!/');
      }

      // Images.
      else if (/\.png|\.jpg|\.svg/.test(url)) {

        // TODO: Send a default image?
        res.send("Image not found:" + url);
      }

      // Others.
      else {
        res.setHeader('Content-Type', 'text/html');
        res.send("Page not found: " + url);
      }

    });

  })

});
