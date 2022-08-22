/**
 * NUTS SERVICE :-)
 */

const $ = require('betiny-core');

/**
 * INSTALL
 * Install database based on SQL file.
 * SHELL = yarn start nuts:install
 */

$.arguments.add('nuts:install', async args => {
    await $.mysql.install({
        file: __dirname + '/data/install.sql',
        dbname: 'nuts'
    });
});

/**
 * IMPORT
 * We catch arguments and forward them to the import script.
 * SHELL = yarn start nuts:import year:xxxx precision:yy level:zz
 */

const nutsImport = require("./core/import.js");

$.arguments.add('nuts:import', nutsImport);

/**
 * ROUTE
 */

const nutsService = require("./core/service.js");

$.route.get("/rest/nuts*", nutsService);

/**
 * DEMO
 */

$.route.static("/demo/nuts", __dirname + "/demo");

$.on("betiny:server:start", () => {
   $.log.info("DEMO NUTS", $.server.url("/demo/nuts") );
});
