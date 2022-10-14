/**
 * SPARQL TREE - POC - Braije Christophe 2022
 */

var root = document.querySelector('#root');
var result = document.querySelector('#result');
var endpoint = "https://publications.europa.eu/webapi/rdf/sparql?default-graph-uri=&";

function getRootTerms(params) {

    var lang = params.lang || 'en';

    var query = `
    PREFIX : <http://www.w3.org/2004/02/skos/core#>

    SELECT *

    WHERE {
      ?term :inScheme <http://data.europa.eu/uxp/det> .
      ?term :topConceptOf <http://data.europa.eu/uxp/det> .
      ?term :prefLabel ?prefLabel .
      FILTER ( lang(?prefLabel) = "${lang}" ) .
    }

    ORDER BY ASC(UCASE(STR(?prefLabel)))
    `;

    var url = endpoint + `query=${encodeURIComponent(query)}`;

    url += "&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on&run=+Run+Query+";

    return url;

};

function getChildURL({ term, lang = 'en' }) {

    const query = `
    PREFIX : <http://www.w3.org/2004/02/skos/core#>

    SELECT *

    WHERE {
      <${term}> :inScheme <http://data.europa.eu/uxp/det> .
      OPTIONAL { <${term}> :narrower ?narrower . } .
    }
    `;

    var url = endpoint + `query=${encodeURIComponent(query)}`;

    url += "&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on&run=+Run+Query+";

    return url;

};

function getTerm (urls, data, callback) {

    var childurl = urls[0];
    var toPivot = data || {};

    urls = urls.slice(1);

    const query = `
    PREFIX : <http://www.w3.org/2004/02/skos/core#>

    SELECT *

    WHERE {
      <${childurl}> :inScheme <http://data.europa.eu/uxp/det> .
      <${childurl}> :prefLabel ?prefLabel .
      FILTER ( lang(?prefLabel) = "en" ) .
    }
    `;

    var url = endpoint + `query=${encodeURIComponent(query)}`;

    url += "&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on&run=+Run+Query+";

    $wt.getFile({
        url: url,
        type: "json",
        success: function (response) {
            console.log(childurl, response.results.bindings[0].prefLabel.value);

            var term = childurl;
            var label = response.results.bindings[0].prefLabel.value;

            toPivot[label] = {
                id: term.substring(term.lastIndexOf('/') + 1),
                url: term
            };

            if (urls.length===0) {
                callback(toPivot);
                return;
            }
            getTerm(urls, toPivot, callback);

        }
    });
};

function append (where, data) {

    // List and ordering.
    var html = "<ol>";
    Object.keys(data).sort(function (aa, bb) {
        var a = aa.toLowerCase(), b = bb.toLowerCase();
        if(a < b) { return -1; }
        if(a > b) { return 1; }
        return 0;
    }).map(function (row) {
        html += $wt.template([
            '<li>',
            "<a href='{url}' aria-controls='_{id}' aria-expanded='false'>{label}</a>",
            "<button id='_{id}' name='{label}' aria-label='Add {label}'>+</button>",
            "</li>"
        ].join(''), {
            label: row,
            id:  data[row].id,
            url: data[row].url
        });
    })

    where.innerHTML += html + '</ol>';

};

function requestChild (elm) {

    var parent = elm.parentNode;
    var isOpen = parent.querySelector('ul');

    if (isOpen) {
        console.log("Already requested");

        return;
    };

    var sub = getChildURL({
        term: elm.href
    });

    $wt.jsonp(sub, function (response) {

        console.log(response.results.bindings);

        var urls = Object.keys(response.results.bindings).map(function (row) {
            if (response.results.bindings[row] && response.results.bindings[row].narrower) {
                return response.results.bindings[row].narrower.value;
            }
            else {
                return null;
            }
        })

        console.log(urls);

        if (urls.length) {
            getTerm(urls, {}, function (data) {
                console.log("ALL CHILDREND", data);
                append(parent, data);
            });
        }

    });

};

window.addEventListener("wtReady", function () {

    /**
     * INIT ROOT
     */

    var url = getRootTerms({
        lang: "fr"
    });

    $wt.jsonp(url, function (response) {

        console.log(response.results.bindings);

        var toPivot = {};
        response.results.bindings.map(function (row) {
            var term = row.term.value;
            var label = row.prefLabel.value;
            toPivot[label] = {
                id: term.substring(term.lastIndexOf('/') + 1),
                url: term
            };
        });

        append(root, toPivot);

    });

    /**
     * JAVASCRIPT DELEGATION
     * Use this approach to avoid loop over each element.
     *
     * @param evt
     */

    root.onclick = function (evt) {
        var elm = evt.target;
        var tag = elm.tagName;
        if (tag === 'A') {
            console.log('TODO: toggle collapse?');
            requestChild(elm);

            return false;
        }
        else if (tag === 'BUTTON') {
            console.log('TODO: trigger an event:', elm.id, elm.name);
            result.innerHTML += $wt.template([
                    "<li>{id} - {name}</li>"
            ].join(''), {
                name: elm.name,
                id: elm.id.split('_')[1]
            });

            $wt.remove(elm);

        }
    };

});