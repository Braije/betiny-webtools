/**
 * BETINY DASHBOARD
 * Trivial page to show some usefull informations
 */

module.exports = $wt => {

  /**
   * GET ROUTE LIST.
   */

  const getRoutes = () => {

    let route = [];

    $wt.route.express._router.stack.forEach( item => {
      let path = (item.route||{}).path;
      if (path) {
        let method = (item.route||{}).methods;
        route.push({
          path: path,
          method: (method.get) ? 'GET' : 'POST'
        })
      }
    });

    return route;

  };

  /**
   * GET LIST OF API.
   */

  const getApiList = (obj, name, data = []) => {

    for(let x in obj) {

      let path = name ? name + "." + x : x;

      if (typeof obj[x] === 'function') {
        data.push({
          name: path,
          type: "FUNCTION"
        });
      }

      else if (typeof obj[x] === 'object'
        && Object.keys(obj[x]).length > 0
        && !Array.isArray(obj[x])
        && path.split(".").length < 4
        && ["glob","path"].indexOf(x) === -1
      ) {
        //console.log(obj[x]);
        // getApiList(obj[x], path, data);
        data.push({
          name: path,
          type: "COLLECTION"
        });
      }

    }

    return data;
  };

  /**
   * GET MIDDELWARE LIST.
   */

  const getMiddelwares = () => {

    let middle = $wt.route.middelware.list();

    return Object.keys(middle).sort((a,b) => {
      return a - b;
    }).map(key => {
      return { key: Number(key) , name: middle[key].name };
    });

  };

  /**
   * DASHBOARD
   * TODO: create a dedicate route for local usage? $wt.route.dev|local ?
   */

  $wt.route.page("/dashboard", {}, (req, res, next) => {

    $wt.template(__dirname + "/templates/dashboard.tpl", {

      api: getApiList($wt),
      route: getRoutes(),
      middelware: getMiddelwares(),
      events: $wt.config.events

    }).then( content =>  res.send(content)).catch(next);

  });

  /**
   * CATCH EVENTS
   */

  $wt.on("ready", () => {

    console.log("\033[32m DASHBOARD:\033[0m \t\t", process.env.HTTP_FULLPATH + "/dashboard");

  });

};
