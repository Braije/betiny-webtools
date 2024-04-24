const $ = require("betiny-core");

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const atob = a => Buffer.from(a, 'base64').toString('binary');
const btoa = b => Buffer.from(b).toString('base64');

/**
 * BATCH GEOCODING SERVICE (Internal usage)
 * We fetch coordinates based on each "feature.geometry.search" found in the geojson.
 * The "search" property is set by the "xlsBufferToJson" method.
 *
 * @param {*} geojson
 * @returns
 */

const batchGeocodingService = (geojson) => {

  // Fake "pause" timer inside an async promise.


  // We use "allSettled" to bypass any unmanage errors and trigger the "success".
  return Promise.allSettled(geojson.features.map(async (feature, index) => {

    // The network noise effect to reduce the network limitation.
    await sleep(Math.round(10 * index * (Math.random() * 2)));

    // Request "nominatim" with search critera provide by user.
    let result = await fetch(
      "https://gisco-services.ec.europa.eu/nominatim/search.php?limit=1&format=json&q=" + feature.geometry.search
    ).then(res => res.json());

    // No matching search result.
    if (!result[0]) {
      console.warn("WTINFO: The geocoding service returns an empty response based on your search criteria:", feature.geometry.search);
    }

    // Found => update coordinates.
    else {
      geojson.features[index].geometry.coordinates = [
        Number(result[0].lon),
        Number(result[0].lat)
      ];
    }

    // Cleanup the geojson by removing the search criteria from the response.
    delete geojson.features[index].geometry.search;

    // Store the result.
    return result;

  // Success.
  })).then(() => {
    return geojson;

  // Error.
  }).catch(() => {
    return geojson;
  })

};

/**
 * ROUTE
 */

$.route.post("/rest/geocoding*", async (req, res) => {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  //res.setHeader('Cross-Origin-Resource-Policy', 'Cross-origin');

  // res.setHeader('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token');

  // Request headers you wish to allow
  // res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  // res.setHeader('Access-Control-Allow-Credentials', true);
  // res.setHeader('Content-Type', 'application/x-www-form-urlencoded');

  res.setHeader('Content-Type', 'application/json');

  let params = req.body;

  /*batchGeocodingService(params.geo).then(result => {

    res.send({
      "toto": params.toto,
      "geo" : result
    })

  });*/

  console.clear();
  console.log("------------------\n", req.query, req.headers);

  // await sleep(5000);
  // console.log("\n", req.body.token );

  req.body.token = JSON.parse(req.body.token);

  req.body.token.batman = "was there";

  res.send(req.body)

});

/**
 * READY
 */

const fakeGeojson = require('./data.js');

$.on("ready", () => {

  console.log(
    $.draw()
      .space(1).background("gray")
      .color("black").text("GEOCODE ").reset()
      .space(1).icon("top").text("  DEMO")
      .text("\n").space(10).icon("end").space(1).color("cyan").underline().text($.server.url('/demo/geocode'))
      .text("\n").reset()
      .finish()
  );

  setTimeout(() => {

    let str = JSON.stringify(fakeGeojson);
    let atb = btoa(str);

    console.log(str.length, atb.length);

    fetch("http://127.0.0.1:3001/rest/geocoding?myquery=test", {
      method: 'POST',
      mode: 'cors',
      cache: 'no-store',
      headers: {
        'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      body: new URLSearchParams({
        name: 'toto',
        size:  "123456",
        token: str
      })
    })
    .then(res => res.json())
    .then(res => console.log("RESPONSE", res))
    .catch(error => console.log(error));


  }, 1000);

});