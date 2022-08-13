/**
 * NUTS DEMO REST API
 * TODO: Manage also protobuff
 */

  // References.
  var pre = document.querySelector('#properties_preview');
  var button = document.querySelector('button');
  var map = L.map('map').setView([50, 4.4], 3);

  L.tileLayer('https://europa.eu/webtools/maps/tiles/osm-ec/3857/{z}/{x}/{y}').addTo(map);

/**
 * PLUGINS
 */

  $('select').select2({
    width: '100%',
    allowClear: true,
  }).on('select2:unselecting', function () {
    var self = $(this);
    setTimeout(function () {
      self.select2('close');
    }, 0);
  });

/**
 * FALLBACK
 */

window.onerror = function () {
  button.style.opacity = 1;
  button.disabled = false;
};

/**
 * AJAX.
 *
 * OPTIONS.
 *
 *  var config = {
 *    "url"        : "anyURL",
 *    "success"    : mySuccessCallbackFunction,
 *    "error"      : myErrorCallbackFunction,
 *    "data"       : "key1=value1&key2=value2",
 *    "dataType"   : "application/x-www-form-urlencoded" (default)
 *  };
 *
 * $wt.ajax(config);
 *
 * @param {type} config - JSON format see "var config"
 */

var ajax = function (config) {

  var url = config["url"];
  var error = config["error"];
  var success = config["success"];
  var data = config["data"];
  var dataType = config["dataType"];
  var binary = config["binary"];
  var credential = config["withCredentials"] || false;
  var method = (data) ? 'POST' : 'GET';

  if (url !== "" && url !== undefined && url !== null) {

    if (!dataType) {
      dataType = "application/x-www-form-urlencoded";
    }

    var request = (function () {
      if (window.XMLHttpRequest) {
        return new XMLHttpRequest();
      }
      else if (window.ActiveXObject) {
        return new ActiveXObject("Microsoft.XMLHTTP");
      }

      return false;
    })();

    if (!request) {
      return;
    }

    // Wel format.
    url = url.replace(/&amp;/ig, "&");

    request.onreadystatechange = function () {
      if (request.readyState === 4) {
        if (request.status !== 200 && request.status !== 304) {
          if (typeof error === "function") {
            error(config);
          }
        }
        else {
          if (typeof success === "function") {
            (binary) ? success(request) : success(request.responseText, request.responseXML, config);
          }
          else {
            return {txt: request.responseText, xml: request.responseXML};
          }
        }
      }

    };

    request.open(method, url, true);

    if (binary) {
      request.responseType = "arraybuffer";
    }

    if (credential) {
      request.withCredentials = true;
    }

    if (method === 'POST') {
      request.setRequestHeader("Content-Type", dataType);
      url = '';
      for (var prop in data) {
        url += encodeURIComponent(prop) + '=' +
          encodeURIComponent(data[prop]) + '&';
      }
      data = url.substring(0, url.length - 1);
      request.send(data);
    }
    else {
      request.send(null);
    }

  }

};

/**
 * FORM SUBMIT
 */

  var COUNTRIES_LAYER;
  var MARKERS_LAYER = L.featureGroup().addTo(map);

  $('form').submit(function (evt) {

    pre.style.display = "none";

    button.style.opacity = 0.5;
    button.disabled = true;

    evt.preventDefault();

    var data = {};

    $(this).serializeArray().forEach(function (el) {
      if (!data[el.name]) {
        data[el.name] = el.value;
      }
      else {
        data[el.name] += ',' + el.value;
      }
    });

    if (!data['countries']) {
      return;
    }

    // Clear previous layers.
    if (COUNTRIES_LAYER) {
      map.removeLayer(COUNTRIES_LAYER);
      MARKERS_LAYER.clearLayers();
    }

    ajax({

      url: '/webtools/rest/nuts?countries=' + data['countries'].split(',') +
        (data['level'] ? '&level=' + data['level'] : '') +
        (data['scale'] ? '&scale=' + data['scale'] : '') +
        (data['language'] ? '&language=' + data['language'] : '') +
        (data['year'] ? '&year=' + data['year'] : '') +
        (data['properties_only'] ? '&properties_only=' + data['properties_only'] : '') +
        (data['pbf'] === 'on' && !data['properties_only'] ? '&format=pbf' : ''),

      binary: data['pbf'] === 'on' && !data['properties_only'],

      success: function (geojson) {

        if (data['pbf'] === 'on' && !data['properties_only']) {
          var pbf = new Pbf(geojson.response);
          geojson = geobuf.decode(pbf);
        }

        else {
          geojson = JSON.parse(geojson);
        }

        if (data['properties_only'] === 'true') {
          pre.innerHTML = JSON.stringify(geojson, "\n", 2);
          pre.style.display = "block";
          button.style.opacity = 1;
          button.disabled = false;
        }
        else {

          if (!geojson.features || geojson.features.length === 0) {
            console.log("NO FEATURES");
            button.style.opacity = 1;
            button.disabled = false;

            return;
          }

          COUNTRIES_LAYER = L.geoJSON(geojson, {
            onEachFeature: function (feature, layer) {

              layer.bindTooltip("<pre>" + JSON.stringify(feature.properties, "\n", 2) + "</pre>", {
                sticky: true,
                direction: "top"
              });

              if (data["centroid"] === 'on') {
                L.marker(feature.properties.CENTROID).addTo(MARKERS_LAYER).bindTooltip("<pre>" + JSON.stringify(feature.properties, "\n", 2) + "</pre>", {
                  sticky: true,
                  direction: "top"
                });
              }

            }
          }).addTo(map);

          try {
            map.flyToBounds(COUNTRIES_LAYER.getBounds());
          }
          catch (e) {

          }

          button.style.opacity = 1;
          button.disabled = false;

        }

      },

      error: function () {
        // ...
        button.style.opacity = 1;
        button.disabled = false;
      }

    });

  });
