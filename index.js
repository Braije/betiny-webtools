/**
 * BASE ARCHITECTURE SERVER (POC) - Braije Christophe - July 2018
 */

console.clear();

const $ = require('betiny-core');

// !!! IMPORTANT !!!!
// Custom middleware should be setup before any route.
$.middleware.add('myCustomMiddleware', 200,(req, res, next) => {
  if (req.betiny.xxx) {
    console.log("\n");
    $.log.top("myCustomMiddleware");
    $.log.child("zzz ->", req.betiny.zzz);
    $.log.end("xxx ->", req.betiny.xxx);
  }
  next();
});

// Self organisation.
require('./app/html2m');
require('./app/nuts');

// Custom root route.
$.route.get('/', { xxx: "yeahhh", zzz: "what?" }, (req, res) => {
  res.send("Welcome to my custom server.");
});

// Custom command.
$.arguments.add("custom:command", params => {
  $.log.end("custom:command was running with these params", params);
  process.exit();
});

// Self start management.
$.server.start(() => {

  // Custom events.
  $.fire('ready');

});
