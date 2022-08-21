/**
 * CUSTOM MIDDLEWARE?
 * TODO: move to central betiny-core as default?
 */

const $ = require('betiny-core');

/**
 * MAIN MIDDLEWARE
 */

const helmet = require("helmet");
const compression = require("compression");

/**
 * CUSTOMIZE MYSELF MIDDLEWARE
 */

let instance = $.server.instance();
let engine = $.server.engine();

instance.set('trust proxy', 1);
instance.set('etag', false);
instance.disable('x-powered-by');

$.middleware.add("helmet", 100, helmet());
$.middleware.add("compression", 120, compression());
$.middleware.add("json_limit", 140, engine.json({ limit: '10MB', extended: true }));
$.middleware.add("urlencoded_limit", 150, engine.urlencoded({ limit: '10MB', extended: true }));
