/**
 * BASE ARCHITECTURE SERVER (POC) - Braije Christophe - July 2018
 */

console.clear();

const $ = require('betiny-core');

// Self organisation.
require('./rest/nuts');

// Self start management.
$.server.start(() => {

  // Root server :-)
  $.route.get('/', (req, res) => {
    res.json("Welcome to my custom server.");
  });

  // Propagate a custom event.
  $.fire('ready');

});
