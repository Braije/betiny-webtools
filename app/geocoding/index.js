const $ = require("betiny-core");

/**
 * ROUTE
 */

$.route.get("/rest/geocoding*", (req, res) => {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 0);

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // Request headers you wish to allow
  // res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  // res.setHeader('Access-Control-Allow-Credentials', true);

  res.setHeader('Content-Type', 'application/json'),

  res.send({
    "test" : "test",
    "query.toto": req.query.toto,
    "query.geo" : req.query.geo,
  })

});

/**
 * READY
 */

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

    let geocoding = {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {
            "fgsdfg": "sdfg"
          },
          "geometry": {
            "coordinates": [
              11.5753822,
              48.1371079
            ],
            "type": "Point"
          },
          "id": 0
        },
        {
          "type": "Feature",
          "properties": {
            "title": "tutu",
            "tata": 12222
          },
          "geometry": {
            "coordinates": [
              5.769102025702125,
              48.56260882321686
            ],
            "type": "Point"
          },
          "id": 1
        },
        {
          "type": "Feature",
          "properties": {},
          "geometry": {
            "coordinates": [
              12.525453940522965,
              52.42765685253369
            ],
            "type": "Point"
          }
        }
      ]
    };

    let geoToStringEncoding = btoa(JSON.stringify(geocoding));

    $.request("http://127.0.0.1:3001/rest/geocoding?toto=tutu&geo=" + geoToStringEncoding).then(data => {
      console.log("RESPONSE", data.response);
    });

  }, 1000);

});