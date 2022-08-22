/**
 * BASE ARCHITECTURE SERVER (POC) - Braije Christophe - July 2018
 */

console.clear();

const $ = require('betiny-core');

// Self organisation.
require('./rest/html2m');
require('./rest/nuts');

// Custom root route.
$.route.get('/', (req, res) => {
  res.send("Welcome to my custom server.");
});

// Self start management.
$.server.start(() => {

  // Custom events.
  $.fire('ready');

});
