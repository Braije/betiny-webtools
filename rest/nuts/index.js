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

$.route.get("/rest/nuts*", { token: false }, nutsService);

/**
 * DEMO
 */

$.route.static("/demo/nuts", __dirname + "/demo");

$.on("betiny:server:start", () => {
   $.log.info("NUTS DEMO", $.server.url("/demo/nuts") );
});

/**
 * TEST ZONE
 * TODO: USE FOR INTERNAL TESTING
 */

$.arguments.add('nuts:job', async args => {

    $.job("NUTS - test using job", {
        continue: true
    })
    .task("Test 1 will success", async cfg => {
        return true;
    })
    .task("Test 2 will continue on error", async cfg => {
        await $.utils.delay(500);
        return false;
    })
    .task("A the last but not least", async cfg => {
        return true;
    })
    .execute( () => {
        process.exit();
    });

});
