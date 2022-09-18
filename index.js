/**
 * BASE ARCHITECTURE SERVER (POC) - Braije Christophe - July 2018
 * ██     ██ ███████ ██████  ████████  ██████   ██████  ██      ███████ 
 * ██     ██ ██      ██   ██    ██    ██    ██ ██    ██ ██      ██      
 * ██  █  ██ █████   ██████     ██    ██    ██ ██    ██ ██      ███████ 
 * ██ ███ ██ ██      ██   ██    ██    ██    ██ ██    ██ ██           ██ 
 *  ███ ███  ███████ ██████     ██     ██████   ██████  ███████ ███████
 */

console.clear();

const $ = require('betiny-core');

// Self organisation.
require('./app/html2m');
require('./app/nuts');
require('./app/etrans');

// Custom root route.
$.route.get('/', (req, res) => {
  res.send("Welcome to Webtools.");
});

// Self start management.
$.server.start( () => { 
  
  setTimeout(() => {
    console.log("");
    $.fire("ready");
  }, 250)

}); 
