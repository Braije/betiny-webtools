/**
 * BASE ARCHITECTURE SERVER (POC) - Braije Christophe - July 2018
 */

console.clear();

const $ = require('betiny-core');

// Self organisation.
require('./middlewares/main.js');
require('./rest/nuts');

// Self start management.
$.server.start(() => {

  // Root server :-)
  $.route.get('/', { token: false }, (req, res) => {
    res.json("Welcome to my custom server.");
  });

  // Propagate a custom event.
  $.fire('ready');

});
