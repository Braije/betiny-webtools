// BETINY API.
const $ = require('betiny-core');

// Exclusive module.
const Pbf = require('pbf');
const geobuf = require('geobuf');

// Custom config.
const config = require("./config.js");

/**
 * NUTS ROUTES MANAGEMENT
 */

module.exports = async (req, res, next) => {

  /**
   * AVAILABLE COUNTRIES WITH NUTS
   * We want a real fresh list of countries with nuts.
   */

  let nuts = await $.mysql('nuts').query("SELECT DISTINCT(cntr_id), year FROM geojson WHERE level=0").catch(() => {
    return [];
  });

  let nuts_year = {};

  nuts.forEach(row => {
    if (!nuts_year[row.year]) {
      nuts_year[row.year] = [];
    }
    nuts_year[row.year].push(row.cntr_id);
  });

  /**
   * QUERY CHECK
   * Assign default value for each parameters.
   */

  let params = {

    countries: (req.query["countries"]||'').trim().toLowerCase().split(',').filter(cntr => {
      return cntr !== '' && cntr.length < 5;
    }),

    scale: Number((req.query["scale"]||'').split('M')[0]) || 60,

    year: Number(req.query["year"]||'') || 2021,

    properties_only: (req.query["properties_only"]||'') === 'true',

    format: (req.query["format"]||'').trim() || 'json',

    level: (level=> {
      return (!level && level !== 0) ? 4 : level
    })(Number(req.query["level"])),

    language: (req.query["language"]||'').toLowerCase() || false,

    nocache: req.query["nocache"] || false

  };

  /**
   * MANDATORY PARAMS
   */

  if (params.countries.length === 0) {

    // We use 206 to avoid cache. It's an error manage.
    res.status(206).send({
      "success" : "false",
      "message" : "Missing input parameters or wrong parameters type."
    });

    return;
  }

  /**
   * SHORCUT => all, eu28, eu27...
   * Base from config.js we allow some shortcut for long list of countries.
   * TODO: use real list from database?
   */

  let shortcut = params.countries.indexOf('eu27') > -1 ? 'eu27' : false;
      shortcut = params.countries.indexOf('eu28') > -1 ? 'eu28' : shortcut;
      shortcut = params.countries.indexOf('all') > -1 ? 'all' : shortcut;

  if (shortcut) {
    params.countries = params.countries.filter(cntr => {
      return cntr !== shortcut;
    }).concat(config[shortcut].map(cntr => {
      return cntr.toLowerCase();
    }));
  }

  // Remove duplicate (ex: eu28 + fr- + be).
  let temp = params.countries.filter(function(item, pos) {
    return params.countries.indexOf(item.slice(0,2)) === pos ||
      params.countries.indexOf(item.slice(0,2)+"-") === pos;
  });

  params.countries = temp;

  /**
   * BUILD MYSQL REQUEST
   * We need a fallback for each countries without nuts.
   */

  params.countries_without_nuts = [];
  params.countries_with_nuts = params.countries.filter(cntr => {

    if (nuts_year[params.year].indexOf(cntr) > -1) {
      return cntr;
    }

    params.countries_without_nuts.push(cntr);

    return false;
  });

  let sql = "SELECT feature, year FROM geojson WHERE" +
  " (scale=? AND year=? AND (" +
      "(level=? AND cntr_id IN ('"+ params.countries_with_nuts.join("','") +"') )" +
      " OR " +
      "(level=4 AND cntr_id IN ('"+ params.countries_without_nuts.join("','") +"') ) " +
   "))";

  let request = await $.mysql('nuts').query(sql, [params.scale, params.year, params.level]).catch(() => {
    return [];
  });

  /**
   * FORMAT RESULT
   * Base from the sql result we need to loop over each
   * features to perform some actions.
   */

  let features = [];

  // For each rows result.
  request.forEach(row => {

    // Loop over each features.
    row.feature.features.forEach(feat => {

      // Remove geometry if properties only.
      if (params.properties_only) {
        delete feat.geometry;
      }

      // Update CNTR_NAME if language request.
      if (params.language) {
        let translate = config.countries_translate[params.language];
        if (translate && translate[feat.properties.CNTR_ID]) {
          feat.properties.CNTR_NAME = translate[feat.properties.CNTR_ID];
        }
      }

      // Push to final features.
      features.push(feat);

    });

  });

  /**
   * GEOJSON
   * Final geojson construct.
   */

  let geojson = {
    "type": "FeatureCollection",
    "features": features
  };

  /**
   * PROTOBUFF
   * Convert to protobuf if request.
   */

  if (params.format === 'pbf') {
    let pbf = new Pbf();
    let buff = geobuf.encode(geojson, pbf);
    let result = Buffer.from(buff, "utf-8");
    res.status(200).type('application/octet-stream').send(result);
    return;
  }

  /**
   * DEFAULT -> GEOJSON
   */

  res.status(200).send(geojson);

};
