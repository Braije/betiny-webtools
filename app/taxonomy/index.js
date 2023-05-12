
const $ = require("betiny-core");

let endpoint = "https://publications.europa.eu/webapi/rdf/sparql?default-graph-uri=&";
let sparkl = {};
let isUniqueLang = false;
let retry = 0;
let official = ["bg","es","cs","da","de",
  "et","el","en","fr","ga","hr","it","lv","lt","hu","mt",
  "nl","pl","pt","ro","sk","sl","fi","sv"
];
let unofficial = [
  "ca",
  "sq",
  "ar",
  "hy",
  "be",
  "he",
  "hi",
  "is",
  "ja",
  "no",
  "mk",
  "ru",
  "tr",
  "ur",
  "vi",
  "zh",
  "uk"
];

/**
 * AlphaOrder.
 *
 * Lexiconographic alpha ordering data.
 *
 *  @EXAMPLE
 *  var DATA =
 *   ["Z","Abr","Á","b","Ė","Å","avec","Ž","C","France","Belgique","ba","BE","Xxx","b"];
 *  $wt.alphaOrder( DATA );
 *  $wt.alphaOrder( DATA, { lang: "cs" });
 *  $wt.alphaOrder( DATA, { lang: "fr" });
 *  $wt.alphaOrder( DATA, { lang: "bg" });
 *  $wt.alphaOrder( DATA, { lang: "unknown" });
 *
 * @param {type} dataSrc - mandatory - array of string
 * @param {type} options - optional - options (one for the moment: choose
 *   lang)
 *
 * @returns {Array|undefined}
 */

const alphaOrder = (dataSrc, options) => {

  if (!Array.isArray(dataSrc)) {
    console.log("WTERROR: alphaOrder need a real ARRAY in first argument!");

    return;
  }

  var orderConf = {
    "default": "aAªáÁàÀăĂâÂåÅǻǺäÄǟǞãÃǡǠąĄāĀæÆǽǼǣǢbBḃḂcCćĆĉĈčČċĊçÇ℅dDďĎḋḊđĐðÐeEéÉèÈĕĔêÊěĚëËęĘēĒėĖəƏfFḟḞƒﬁﬂgGğĞĝĜǧǦġĠģĢǥǤhHĥĤȟȞħĦiIíÍìÌĭĬîÎïÏĩĨİįĮīĪıĳĲjJĵĴkKǩǨķĶĸlLĺĹľĽļĻłŁŀĿmMṁṀnⁿNńŃňŇñÑņŅŋŊŉ№oOºóÓòÒŏŎôÔöÖőŐõÕǫǪǭǬōŌøØǿǾœŒpPṗṖqQrRŕŔřŘŗŖɼsSśŚŝŜšŠṡṠşŞșȘſẛßtTťŤṫṪţŢțȚŧŦ™uUúÚùÙŭŬûÛůŮüÜűŰũŨųŲūŪvVwWẃẂẁẀŵŴẅẄxXyYýÝỳỲŷŶÿŸzZźŹžŽżŻʒƷǯǮ",
    "greek": "αΑἀἈἄἌἂἊἆἎἁἉἅἍἃἋἇἏάΆὰᾺᾶάΆᾳᾼᾀᾈᾄᾌᾂᾊᾆᾎᾁᾉᾅᾍᾃᾋᾇᾏᾴᾲᾷᾰᾸᾱᾹβϐΒγΓδΔεΕἐἘἔἜἒἚἑἙἕἝἓἛέΈὲῈέΈϝϜϛϚζΖηΗἠἨἤἬἢἪἡἩἥἭἣἫἧἯήΉὴῊῆἦἮήΉῃῌᾐᾘᾔᾜᾒᾚᾖᾞᾑᾙᾕᾝᾓᾛᾗᾟῄῂῇθϑΘιιΙἰἸἴἼἲἺἶἾἱἹἵἽἳἻἷἿίΊὶῚῖίΊῐῘϊΪΐῒῗΐῑῙκϰΚϗλΛμµΜνΝξΞοΟὀὈὄὌὂὊὁὉὅὍὃὋόΌὸῸόΌπϖΠϟϞρϱΡῤῥῬσςΣτΤυΥὐὔὒὖὑὙὕὝὓὛὗὟύΎὺῪῦύΎῠῨϋΫΰῢῧΰῡῩφϕΦχΧψΨωΩΩὠὨὤὬὢὪὦὮὡὩὥὭὣὫὧὯώΏὼῺῶώΏῳῼᾠᾨᾤᾬᾢᾪᾦᾮᾡᾩᾥᾭᾣᾫᾧᾯῴῲῷϡϠ",
    "cyrillic": "аАӑӐӓӒәӘӛӚӕӔбБвВгГґҐғҒҕҔдДђЂѓЃҙҘеЕѐЀёЁӗӖєЄжЖӂӁӝӜҗҖзЗӟӞѕЅӡӠиИѝЍӣӢӥӤіІїЇйЙјЈкКқҚӄӃҡҠҟҞҝҜлЛљЉмМнНңҢӈӇҥҤњЊоОӧӦөӨӫӪпПҧҦрРсСҫҪтТҭҬћЋќЌуУӯӮўЎӱӰӳӲүҮұҰфФхХҳҲһҺцЦҵҴчЧӵӴҷҶӌӋҹҸҽҼҿҾџЏшШщЩъЪыЫӹӸьЬэЭюЮяЯҩҨӀ"
  },

      options = options || {
        lang: document.lang || "default"
      },

      langGroup = {
        "el": "greek",
        "bg": "cyrillic",
        "uk": "cyrillic",
        "mk": "cyrillic",
        "sr": "cyrillic"
      },

      orderLang = {
        "default": ["default", "greek", "cyrillic"],
        "greek": ["greek", "default", "cyrillic"],
        "cyrillic": ["cyrillic", "default", "greek"]
      };

  dataSrc.sort();

  var lang = langGroup[options.lang] || "default";
  var p = orderLang[lang];
  var o = '';
  var word = '';
  var order = [];
  var tmp = [];
  var index = '';

  for (var val in p) {
    o = orderConf[p[val]].split("");
    for (var k in o) {
      for (var kk in dataSrc) {
        word = dataSrc[kk];
        if (word.charCodeAt(0) === o[k].charCodeAt(0)) {
          order.push(dataSrc[kk]);
          tmp.push(dataSrc[kk]);
        }
      }
    }
    for (var k in tmp) {
      index = dataSrc.indexOf(tmp[k]);
      dataSrc.splice(index, 1);
    }
    tmp = [];
  }

  return order.concat(dataSrc);
};

const rootURL = (lang = 'en') => {

  // ?term :altLabel ?altLabel .

  let query = `
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

  return url + "&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on&run=+Run+Query+";

};

const childURL = (term, lang = 'en') => {

  const query = `
    PREFIX : <http://www.w3.org/2004/02/skos/core#>
    SELECT *
    WHERE {
      <${term}> :inScheme <http://data.europa.eu/uxp/det> .
      OPTIONAL { <${term}> :narrower ?narrower . } .
    }
  `;

  var url = endpoint + `query=${encodeURIComponent(query)}`;

  return url + "&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on&run=+Run+Query+";

};

const termURL = (term, lang = 'en') => {

  const query = `
    PREFIX : <http://www.w3.org/2004/02/skos/core#>
    SELECT *
    WHERE {
      <${term}> :inScheme <http://data.europa.eu/uxp/det> .
      <${term}> :prefLabel ?prefLabel .
      <${term}> :definition ?definition .
      FILTER ( lang(?prefLabel) = "${lang}" AND lang(?definition) = "${lang}") .
    }
  `;

  var url = endpoint + `query=${encodeURIComponent(query)}`;

  return url + "&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on&run=+Run+Query+";

};

const getTerm = (parent, urls, lang = 'en', callback) => {

  let childurl = urls[0];
  let ori = urls;

  if (!childurl) {

    if (typeof callback === 'function') {
      callback();
    }

    return;

  };

  urls = urls.slice(1);

  $.request(termURL(childurl, lang)).then(data => {

    // console.log(data.response.results.bindings);

    retry = 0;

    if (data.response.results.bindings[0]) {
      let currentChild = {
        parent: parent,
        id: childurl.substring(childurl.lastIndexOf('/') + 1),
        url: childurl,
        name: data.response.results.bindings[0].prefLabel.value,
        definition: data.response.results.bindings[0].definition.value,
      };

      sparkl.push(currentChild);

      console.log(
        $.draw()
          .space(4).icon('pipe').space(3)
          .color('yellow').text('+').reset()
          .space(1).color('gray').text(currentChild.name).reset()
          .finish()
      );

    }

    setTimeout(() => {
      getTerm(parent, urls, lang, callback);
    }, 25);

  }).catch( err => {

    if (err.code === 503 && retry < 4) {

      retry++;

      console.log(
        $.draw()
          .space(4).icon('pipe').space(3)
          .color('red').text('+').reset()
          .space(1).color('gray').text("RETRY").reset()
          .finish()
      );

      setTimeout(() => {
        getTerm(parent, ori, lang, callback);
      }, 25);

    }

  });

};

const getChild = (node, lang = 'en', callback) => {

  let term = node.url;

  $.request(childURL(term, lang)).then(data => {

    retry = 0;

    //console.log(data.response.results.bindings);

    // List of url of each children.
    let childrenList = data.response.results.bindings.map(row => {
      return row.narrower?.value;
    }).filter(row => {
      return row;
    });

    console.log(
      $.draw()
        .space(4).icon('pipe').space(2)
        .color('gray').text('CHILDREN')
        .space(1).color('yellow').text(childrenList.length).reset()
        .text("\n").space(4).icon("pipe")
        .finish()
    );

    if (childrenList.length) {
      getTerm(node.id, childrenList, lang, callback);
    }
    else {
      callback();
    }

  }).catch( err => {

    if (err.code === 503 && retry < 4) {

      retry++;

      console.log(
        $.draw()
          .space(4).icon('pipe').space(2)
          .color('gray').text('RETRY')
          .space(1).color('yellow').text(retry).reset()
          .text("\n").space(4).icon("pipe")
          .finish()
      );

      getChild(node, lang, callback);

    }

  });

};

const rootThrottle = (index, lang) => {

  let data = sparkl[index];

  if (!data) {

    console.log(
      $.draw()
        .space(3).icon("check")
        .space(1).background("green").color('black').text(' SAVE ').reset()
        .finish()
    );

    sparkl = sparkl.map(node => {
      delete node.url;
      return node;
    });

    $.file.create('temp/taxonomy_' + lang + '.json', JSON.stringify(sparkl,2,2));

    if (isUniqueLang) {
      process.exit();
    }

    return;

  }

  console.log(
    $.draw()
      .space(3).background("green").color('black').text(' ' + lang.toUpperCase() + ' ').reset()
      .space(1).background('yellow').color('black').text(' ' + index  + ' ').reset()
      .text('\n').space(4).icon("top")
      .finish()
  );

  console.log(
    $.draw()
      .space(4).icon('child').space(1).text(data.name)
      .finish()
  );

  getChild(data, lang, rootCallback = (e) => {

    console.log(
      $.draw()
        .space(4).icon("pipe").text("\n")
        .space(4).icon('end').space(1)
        .color('gray').text('END\n')
        .finish()
    );

    index++;

    rootThrottle(index, lang);

  });

};

const getDico = (lang = 'en') => {

  console.log("\n");

  $.request(rootURL(lang)).then(data => {

    // return console.log(data.response.results.bindings);

    // => LABEL : { id: xxx, url: zzz }
    let toPivot = {};
    data.response.results.bindings.map(function (row) {
      let term = row.term.value;
      let label = row.prefLabel.value;
      toPivot[label] = {
          parent: false,
          id: term.substring(term.lastIndexOf('/') + 1),
          url: term
      };
    });

    // FROM LABEL ORDER => ["b", "a", "c"]
    // TO REAL ALPHA ORDER BASED ON LANGUAGE => ["a", "b","c"]
    let pivotOrder = alphaOrder(Object.keys(toPivot), { lang: "fr" });

    // => { id: xxx, url: yyy, name: zzz }
    sparkl = pivotOrder.map(entry => {
      return {...toPivot[entry], ...{
        name: entry
      }};
    });

    // console.log(sparkl);

    rootThrottle(0, lang);

  }).catch( err => console.log );

};

/**
 * ARGUMENTS
 * It take +/- 2min by language (1656 translations).
 */

$.arguments.add('import:taxonomy', (cfg) => {

  if (cfg.lang) {
    isUniqueLang = true;
    getDico(cfg.lang);
  }
  else {
    console.log(
      $.draw()
        .text('\n').space(4)
        .color('yellow').text("Missing argument lang:xx").reset()
        .finish()
    );
    process.exit();
  }

});

/**
 * DEMO
 * TODO: yeahhh.
 */

$.route.static("/demo/taxonomy", __dirname + "/demo/002");

/**
 * READY
 */

$.on("ready", () => {

  console.log(
    $.draw()
      .space(1).background("green")
      .color("black").text("TAXONOMY").reset()
      .space(1).icon("top").text("  DEMO")
      .text("\n").space(10).icon("end").space(1).color("cyan").underline().text($.server.url('/demo/taxonomy'))
      .text("\n").reset()
      .finish()
  );

});
