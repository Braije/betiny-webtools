/**
 * CORS
 * As middelware, we setup header if request by config parameter for a route.
 *
 * SYNTAX
 *
 *  $wt.route.XXX( PATH, { cors: true }, (req, res, next) => { ... });
 *
 */

module.exports = $wt => {

  // Trivial example that can be improve for more supported header etc..
  $wt.route.middelware.add("CORS - Header", 105, (req, res, next) => {

    if (req.config.cors) {
      res.header("Access-Control-Allow-Origin", "*");
    }

    next();

  });

  $wt.route.middelware.add("TOTO - Header", 106, (req, res, next) => {
    if (req.config.toto === "tutu") {
      console.log("mqlkdsjfqmlsdkfjqsmldkfjqsdlmfkjsdmflkjsdmlkj");
    }
    next();
  });

  $wt.on("ready", () => {
    //console.log("List of existing middelware", $wt.route.middelware.list());
  });

};
