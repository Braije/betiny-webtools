
// BETINY API.
const $ = require('betiny-core');

// TODO: move to API as central.
const axios = require('axios');
const path = require('path');
const fs = require('fs');

// Custom config.
const config = require('./config.js');

/**
 * IMPORT GEOJSON GISCO FILE TO MYSQL DATABASE
 *
 * @param params {object} - forward by "$.argument" process
 * @returns {Promise<void>}
 */

module.exports = async (params = {}) => {

  /**
   * TIMER
   * Use for benchmark purpose.
   */

  console.time("Import geojson");

  /**
   * AT START WE CREATE EACH ITERATION
   * We create an array with all possible case base from import parameters.
   */

  let available = $.iterate(config.import);

  /**
   * ARGUMENTS
   */

  let args = Object.keys(params);
  let size = args.length;
  let year = (params.year) ? Number(params.year) : false;
  let precision = params.precision || false;
  let level = (params.level === 'false') ? false : Number(params.level);

  let iterations = (size === 0) ? available : available.filter(entry => {

    if (size === 3 && year === entry.year && precision === entry.precision && level === entry.level) {
      return true;
    }
    else if (size === 2 && (
        (year === entry.year && precision === entry.precision) ||
        (year === entry.year && level === entry.level) ||
        (precision === entry.precision && level === entry.level)
    ) ) {
      return true;
    }
    else if (size === 1 && (year === entry.year || precision === entry.precision || level === entry.level) ) {
      return true;
    }

    return false;
  });

  /*
  console.log(params, iterations);
  process.exit();
  return;
  /* */

  /**
   * GET GEOJSON AS STREAM
   * Get any geojson file as stream and showing a progress bar.
   *
   * @param parameters
   * @returns {Promise}
   */

  const getDataStream = async (parameters = {}) => {

    // References.
    let params = {
      url: parameters.url || '',
      store: (parameters.store === false) ? false : (parameters.store || "download"),
      filename: false,
      loading: parameters.loading || "  \033[90m└─\033[32m DOWNLOAD\033[0m  {pourcent}"
    };

    // Return as promise to manage also error from "business".
    return new Promise( async (resolve, reject) => {

      let localFile = false;

      if (params.store) {

        // Build store path.
        let storePath = path.resolve($.env("ROOT_PATH") + "/temp/" + params.store + "/");

        // Check store path.
        try {

          // Create store path.
          await $.file.create(storePath);

        }
        catch (error) {

          // Drop error in case if not possible to create store path.
          reject("Not able to create the store path");

          return;
        }

        // Store file to this path.
        localFile = path.resolve(storePath +  "/" + (params.filename || params.url.split('/').pop()));

        let localSize = 0;

        try {
          let stats = await fs.statSync(localFile);
          localSize = stats.size;
        }
        catch (err) {
        }

        // Get size info base from HEAD.
        let sizeCheck = await axios({
          url: params.url,
          method: 'HEAD'
        }).catch(() => {
          return {
            headers: {
              "content-length": 0
            }
          };
        });

        let remoteSize = Number(sizeCheck.headers['content-length']);

        // If file already exist and same size, use it.
        if (remoteSize === localSize && $.file.exist(localFile)) {
          let content = await $.file.read(localFile, 'utf8');

          console.log($.replace(params.loading, {
            byte: '',
            total: $.formatBytes(remoteSize),
            pourcent: 100
          }));

          resolve(content);
          return;
        }

      }

      // Create the request.
      const response = await axios({
        url: params.url,
        method: 'GET',
        responseType: 'stream'
      }).catch(reject);

      // Case if url is failed.
      if (!response || !response.data || !response.headers) {
        reject();
        return;
      }

      // Get size of geojson file.
      let totalLength = response.headers['content-length'];
      let total = $.formatBytes(totalLength);

      let byte = 0;
      let result = '';

      // Writer
      if (params.store) {
        const writer = fs.createWriteStream(localFile);
        response.data.pipe(writer);
      }

      // Trivial "Progress bar".
      response.data.on('data', chunk => {

        byte = byte + chunk.length;
        result += chunk;

        let message = $.replace(params.loading, {
          byte: $.formatBytes(byte),
          total: total,
          pourcent: Math.round((byte/totalLength) * 100)
        });

        process.stdout.cursorTo(0);
        process.stdout.clearLine();
        process.stdout.write(message);

      });

      // At the end return the features collection.
      response.data.on('end', () => {
        console.log("");
        resolve(result);
      });

    });

  };

  /**
   * GET LABEL
   * Build right url and return the content.
   *
   * @param parameters
   * @returns {}
   */

  const getLabel = async (parameters = {}) => {

    // References.
    let params = {
      level: parameters.level,
      year: parameters.year || 2016,
      projection: parameters.projection || 4326,
      precision: parameters.precision || parameters.scale|| 60
    };

    // TIPS: non uniform data between nuts (2021) / countries (2020)
    params.year = (params.year === 2021 && params.level === false) ? 2020 : params.year;

    let target = '';

    // BOUNDARY
    if (params.level === false) {
      target = '{url}/countries/geojson/CNTR_LB_{year}_{projection}.geojson';
    }
    // NUTS
    // https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_LB_2021_4326_LEVL_0.geojson
    else {
      target = '{url}/nuts/geojson/NUTS_LB_{year}_{projection}_LEVL_{level}.geojson';
    }

    let url = $.replace(target, {
      url: config.eurostat,
      year: params.year,
      projection: params.projection,
      level: String(params.level)
    });

    let centroid = {};

    let content = await getDataStream({
      url: url,
      store: 'nuts',
      loading: $.draw()
        .space(5).icon("child").color("yellow").text(" CENTROID").reset()
        .text("\t").text( url.split('/').pop() )
        .text("\t").icon("pipe").color("green").text(" {pourcent}%")
        .color("gray").text(" ({total})")
      .finish()
    }).catch((e) => {
      console.log(
        $.draw()
          .space(5).icon("end").color("red").text(" " + e.message)
          .text("\n")
          .space(8).color("gray").text(url + "\n")
          .finish()
      );
      process.exit();
    });

    // String to object.
    try {
      content = JSON.parse(content).features
    }
    catch (error) {
      content = [];
    }

    content.forEach( feat => {
      let ID = feat.properties.NUTS_ID || feat.properties.CNTR_ID;
      centroid[ID] = feat.geometry.coordinates;
    });

    return centroid;

  };

  /**
   * GET COUNTRIES
   * Build right url and return the content.
   *
   * @param parameters {object} => iteration queue object
   * @returns []
   */

  const getCountries = async (parameters = {}) => {

    // References.
    let params = {
      level: parameters.level,
      year: parameters.year || 2016,
      projection: parameters.projection || 4326,
      precision: parameters.precision || parameters.scale || 60
    };

    // TIPS: non uniform data between nuts (2021) / countries (2020)
    params.year = (params.year === 2021 && params.level === false) ? 2020 : params.year;

    // NUTS
    let target = '{url}/nuts/geojson/NUTS_RG_{precision}M_{year}_{projection}_LEVL_{level}.geojson';

    // BOUNDARY
    if (params.level === false) {
      target = '{url}/countries/geojson/CNTR_RG_{precision}M_{year}_{projection}.geojson';
    }

    // Format url.
    let url = $.replace(target, {
      url: config.eurostat,
      precision: params.precision,
      year: params.year,
      projection: params.projection,
      level: String(params.level)
    });

    // console.log("  \033[90m└─\033[32m COUNTRIES\033[0m\t", url.split('/').pop());

    // Get the content.
    let content = await getDataStream({
      url: url,
      store: 'nuts',
      loading: $.draw()
      .space(5).icon("child").color("yellow").text(" COUNTRIES").reset()
      .text("\t").text( url.split('/').pop() )
      .text("\t").icon("pipe").color("green").text(" {pourcent}%")
      .color("gray").text(" ({total})")
    .finish()
    }).catch(e => {
      console.log(
        $.draw()
          .space(5).icon("end").color("red").text(" " + e.message)
          .text("\n")
          .space(8).color("gray").text(url + "\n")
          .finish()
      );
      process.exit();
    });

    // String to object.
    try {
      content = JSON.parse(content).features
    }
    catch (error) {
      content = [];
    }

    return content;

  };

  /**
   * IMPORT COUNTRIES
   *
   * @param parameters {object} - case if you call this method manually
   * @param callback {function} - use for queue
   * @returns {Promise<void>}
   */

  const importCountries = async (parameters, callback) => {

    // References.
    let params = {
      level: parameters.level,
      year: parameters.year || 2016,
      projection: parameters.projection || 4326,
      precision: parameters.precision || parameters.scale || 60
    };

    /**
     * ALIGN FEATURE
     * Refactoring of original feature to push inside a main object
     *  ==> featuresFamily[ id || CNTR_ID ] = geojson + features
     *
     * @param feature {object}
     * @param id {string} - optional, setup the CNTR_ID reference name manually.
     */

    let featuresFamily = {};
    let count = 0;

    const alignFeature = (feature, id) => {

      let CNTR_ID = feature.properties.CNTR_ID || feature.properties.CNTR_CODE;
      let CNTR_INFO = config.centroid[CNTR_ID]||{};
      let CENTROID = centroid[feature.properties.NUTS_ID || CNTR_ID];
          CENTROID = (CENTROID) ? [CENTROID[1],CENTROID[0]] : (CNTR_INFO.c || [0,0]);
      let LEVEL = feature.properties.LEVL_CODE || feature.properties.LVL_CODE;
          LEVEL = (LEVEL === 0) ? 0 : LEVEL;
          LEVEL = (LEVEL === false) ? false : LEVEL;
          LEVEL = (!LEVEL) ? false : LEVEL;

      let newFeature = {
        "type": "Feature",
        "geometry": feature.geometry,
        "properties": {
          "CNTR_ID" : CNTR_ID,
          "CNTR_NAME": feature.properties.NAME_ENGL || CNTR_INFO.l || null,
          "NUTS_ID": feature.properties.NUTS_ID || null,
          "NUTS_NAME": feature.properties.NUTS_NAME || null,
          "CENTROID": CENTROID,
          "LVL_CODE": LEVEL
        }
      };

      CNTR_ID = id || newFeature.properties.CNTR_ID;

      if (!featuresFamily[CNTR_ID]) {
        featuresFamily[CNTR_ID] = {
          "type": "FeatureCollection",
          "features": []
        }
      }

      featuresFamily[CNTR_ID].features.push(newFeature);

      count++;

    };

    /**
     * GET LOCAL GEOJSON FILE
     * Load from "./src" folder locally exception layers.
     *
     * @param cntr {string} - CNTR_ID
     * @param level {mixte} - false | 0 | 1 | 2 | 3
     * @param filter {function} => apply this filtering on result?
     * @returns {Promise<*>}
     */

    const getLocal = async (cntr, level, filter) => {

      // Boundary country.
      let url = [__dirname, "/../data/countries/", cntr, "/CNTR_", params.precision, "M_2021_", params.projection].join('');

      // Nuts: 03-10-20-60
      if (level > -1) {
        url = [__dirname, "/../data/countries/", cntr, "/NUTS_RG_", params.precision, "M_2021_", params.projection, "_LEVL_", params.level].join('');
      }

      url = path.resolve(url);

      let cat = params.level === false ? 'BOUND' : 'NUTS';

      let content = await fs.promises.readFile(url + ".geojson", 'utf8').catch(() => {
        console.log("      \033[90m├─\033[31m " + cat + " " + cntr.toUpperCase() + "-\033[0m" + path.basename(url));
        process.exit();
      });

      if (content) {

        console.log(
          $.draw()
            .space(5).icon("child").color("cyan")
            .text(" " + cat + " ")
            .text(cntr.toUpperCase() + "-")
            .text("\t").color("gray").text(path.basename(url)).text(".geojson")
            .reset()
            .finish()
        );

        let features = JSON.parse(content).features;

        if (typeof filter === 'function') {
          features = await filter(features);
        }

        return features;
      }
      else {
        return false;
      }

    };

    /**
     * RETRIEVE DATA
     *  - COUNTRIES
     *  - CENTROID (label)
     *  - EXCEPTION COUNTRIES: FR, PT, ES, KS
     */

    // $.log(params.year, params.precision, params.level, params.projection);

    let centroid = await getLabel(params);

    if (!centroid || Object.keys(centroid).length === 0) {
      //console.log("    \033[90m└─\033[32m ERROR\033[90m\t ", "Centroid :( \033[0m");
      process.exit();
      return;
    }

    let countries = await getCountries(params);

    if (!countries || countries.length === 0) {
      //console.log("    \033[90m└─\033[32m ERROR\033[90m\t ", "Countries :( \033[0m");
      process.exit();
      return;
    }

    // It's just a loop over json array.
    countries.forEach( feature => alignFeature(feature));

    // BOUNDARY
    if (params.level === false) {

      let fr = await getLocal("fr");
      fr.forEach(feat => alignFeature(feat, "FR-"));

      let es = await getLocal("es");
      es.forEach(feat => alignFeature(feat, "ES-"));

      let pt = await getLocal("pt");
      pt.forEach(feat => alignFeature(feat, "PT-"));

      console.log(
        $.draw()
          .space(5).icon("child").color("gray")
          .text(" BOUND KS ")
          .text("\t").color("gray").text("NOT APPLICABLE")
          .reset()
          .finish()
      );

    }

    // NUTS
    else {

      let fr = await getLocal("fr", params.level);
      fr.forEach(feat => alignFeature(feat, "FR-"));

      let es = await getLocal("es", params.level);
      es.forEach(feat => alignFeature(feat, "ES-"));

      let pt = await getLocal("pt", params.level);
      pt.forEach(feat => alignFeature(feat, "PT-"));

      let ks = await getLocal("ks", params.level);
      ks.forEach(feat => alignFeature(feat, "KS"));

    }

    let countriesLength = Object.keys(featuresFamily).length;

    /**
     * FEATURES STATS
     */

    console.log(
      $.draw()
        .space(5).icon("child").color("cyan").text(" NRB FEATURES\t")
        .color("yellow").text(count)
        .finish()
    );
    console.log(
      $.draw()
        .space(5).icon("child").color("cyan").text(" NRB COUNTRIES\t")
        .color("yellow").text(countriesLength)
        .text("\n").space(5).icon("pipe")
        .finish()
    );

    /**
     * CREATE THE PROCESS QUEUE
     */

    let loop = 0;

    let processDB = async what => {

      loop++;

      // References.
      let cntr_id_key = Object.keys(what)[0];
      let entry = what[cntr_id_key];

      if (!entry) {
        process.stdout.moveCursor(0, 2);
        process.exit();
        return;
      }

      let properties = entry.features[0].properties;
      let values = [
        params.year,
        params.projection,
        params.precision || params.scale,
        (params.level === false) ? 4 : params.level,
        cntr_id_key.toLowerCase()
      ];

      // CHECK IF EXIST?
      await $.mysql('nuts').query("SELECT * FROM geojson WHERE year=? AND projection=? AND scale=? AND level=? AND cntr_id=? LIMIT 0,1", values)

      // RESULT.
      .then( async result => {

        // Add feature value.
        values.push(JSON.stringify(entry));

        // NEW INSERT.
        if (result.length === 0) {

          await $.mysql('nuts').query("INSERT INTO geojson (year, projection, scale, level, cntr_id, feature) VALUES (?,?,?,?,?,?)",
          values).then( result => {

            process.stdout.cursorTo(0);
            process.stdout.clearLine();
            process.stdout.write(
              $.draw()
                .space(5).icon("end").color("yellow").text(" INSERT:\t\t")
                .reset().text(properties.CNTR_ID)
                .text(" (" + loop + " / " + countriesLength + ")")
                .finish()
            );

          }).catch( error => {

            process.stdout.cursorTo(0);
            process.stdout.clearLine();
            process.stdout.write(
              $.draw()
                .space(5).icon("end").color("red").text(" INSERT:\t\t")
                .reset().text(properties.CNTR_ID)
                .finish()
            );

          });

        }

        // UPDATE
        else {

          let id = result[0].id;

          await $.mysql('nuts').query("UPDATE geojson SET feature=? WHERE id=?", [
            JSON.stringify(entry),
            id
          ]).then( () => {

            // process.stdout.cursorTo(0);
            // process.stdout.clearLine();
            // process.stdout.write

            process.stdout.write(
              $.draw()
                .space(5).icon("end").color("yellow").text(" UDPATE:\t\t")
                .reset().text(properties.CNTR_ID)
                .text(" (" + loop + " / " + count + ")")
                .finish()
            );

          }).catch( () => {

            process.stdout.cursorTo(0);
            process.stdout.clearLine();
            process.stdout.write(
              $.draw()
                .space(5).icon("end").color("red").text(" UPDATE:\t\t")
                .reset().text(properties.CNTR_ID)
                .finish()
            );

          });
          /* */

          console.log("\n");
          process.stdout.moveCursor(0,-2);

        }

      // ERROR.
      }).catch( error => {

        console.log(
          $.draw()
          .space(5).icon("end").color("red").text(" ERROR:\t\t")
          .reset().text(error)
          .finish()
        );

      });

      delete what[Object.keys(what)[0]];

      return what;

    };

    /**
     * CREATE THE QUEUE MECHANISM
     */

    let myCountriesQueue = $.queue({ delay: 10 });

    // Create the queue array base family group.
    (Object.keys(featuresFamily)).forEach((cntr_id) => {
      myCountriesQueue.add( async data => {
        return await processDB(data || featuresFamily);
      })
    });

    myCountriesQueue.execute( () => {
      if (typeof callback === 'function') {
        callback();
      }
    });

  };

  /**
   * START
   * Use to create database if needed and construct the iteration queue process.
   */

  const start = async () => {

    // Hide terminal cursor.
    process.stderr.write('\x1B[?25l');

    // First, check if tables exist.
    let tables = await $.mysql('nuts').query("SHOW TABLES LIKE 'geojson'");

    // If not exist.
    if (tables.length === 0) {

      console.log(
        $.draw()
          .text("\n")
          .space(4).background("red").text(" GEOJSON ").reset()
          .text("\n").space(5).icon("top")
          .text("\n").space(5).icon("end").color("gray").text(" Install your database first.")
          .text("\n").space(7).color("white").text(" yarn start nuts:install\n")
          .reset()
          .finish()
      );

      process.exit();

    }

    /**
     * BUILD QUEUE PROCESS
     */

    let count = 1;
    let total = iterations.length;

    // Process each one by one.
    const run = () => {

      let entry = iterations[0];

      iterations.shift();

      if (!entry) {
        console.log("\n");
        console.timeEnd("Import geojson");

        // Show terminal cursor
        process.stderr.write('\x1B[?25h');
        process.exit();

        return;
      }

      // Log info.
      console.log(
        $.draw()
          .text("\n\n")
          .space(4).background("cyan").text(" JOB ").reset()
          .text("\t\t").color("yellow").text("" + count).color("gray").text(" / ").text(total + " ") 
          .reset()
          .text("\n")
          .space(5).icon("top")
          .reset()
          .finish()
      );

      count++;

      importCountries(entry, () => {
        setTimeout(run, 10);
      });

    };

    setTimeout(run, 125);

  };

  /**
   * TEST
   */

  /*
  return importCountries({
    projection: 4326, // ONLY ONE AVAILABLE FOR ALL !!!!
    year: 2021,
    precision: '01',
    level: 0
  }, () => {
    console.log("\n");
    console.timeEnd("Import geojson");
    process.exit();
  });
  /* */

  /**
   * RUN
   */

  start();

};
