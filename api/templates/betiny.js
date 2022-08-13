/**
 * TEMPLATES
 * Custom templating engine to fit the job.
 */

const cheerio = require('cheerio');

module.exports = $wt => {

  /**
   * REFERENCES
   * We want to share some values with others modules.
   */

  $wt.config.template = {

    // Files cache as STRING (memory cache).
    cache: [],

    // Placeholders reference (reset at the end of each rendering template).
    placeholder: {},

    // Custom tag processing.
    custom: []

  };

  /**
   * GET "toto.tutu" VALUE FROM {json}
   *
   * @param object {object} => json object
   * @param keys {string} => path dot notation => "toto.tutu"
   * @returns {*}
   */

  const getValue = (object, keys) => keys.split('.').reduce((o, k) => (o || {})[k], object);

  /**
   * PLACEHOLDER
   * - Replace {any} by data[any].
   * - Replace {any.x} by data[any][x]
   *
   * @param str = STRING
   * @param arr = JSON => { key_to_replace : value }
   * @param clean = BOOLEAN => cleanup the {placeholder} or not
   * @returns {string}
   */

  const placeholder = (str, arr, clean) => {

    return str.replace(/\{([\w\.\!]+)\}/g, (key, name) => {

      // arr[name] = {}.
      if (typeof arr[name] === "object") {
        return JSON.stringify(arr[name]);
      }

      //
      else if (key.indexOf(".") > 0) {

        //let getter = new Function("obj", "return obj." + name.split('.').slice(1).join('.') + ";");
        let val = getValue(arr, name.split('.').slice(1).join('.'));

        if (typeof val === 'string') {
          return val;
        }

        else {
          return key;
        }

      }

      return (arr[name] || arr[name] === 0) ? arr[name] : (clean) ? "" : key;

    });

  };

  // TEST
  placeholder.string = (str, replace = {}) => {

    return str.replace(/\{([\w\.\!]+)\}/g,  (key, name) => {

      // Replace {key} => placeholder[name] value.
      if (typeof replace[name] === 'string') {
        return replace[name];
      }

      // Return original {key}
      return key;

    });

  };

  /**
   * Throttle dom to replace content base from data.
   *
   * @param $
   * @param data
   * @param callback
   * @returns {string}
   */

  const readDom = ($, data, callback) => {

    // Custom tag.
    $wt.config.template.custom.forEach( fnc => {
      fnc($, data, callback);
    });

    // Dirty hack to render fully markup when lang attribute is define.
    let xhtml = ($("DOCTYPE")) ? $.root().html() : $.html( $("body").contents() );

    // TODO: use session instead of config.
    if (!$wt.config.debug) {
      xhtml = (xhtml).replace(/\s+/ig, ' ').replace(/\>\</g,'> <')
    }
    xhtml = placeholder(xhtml, data, true);

    // RESET.
    $wt.config.template.placeholder = {};

    // Callback and return.
    if (callback) {
      callback(false, xhtml)
    }
    else {
      return xhtml
    }

  };

  /**
   * INCLUDE TAG
   * - Replace all include tag by the real XHTML content.
   *
   * @param $
   * @param data
   * @param callback
   * @returns {Promise<void>}
   */

  const include = ($, data, callback) => {

    // Replace the include tag by the content
    const replaceInclude = () => {

      // We need queue this step because some include can also contains include ^^.
      let queue = Array.prototype.slice.call($("include"));

      // The tag 'include' as dom object.
      let tag = queue[0];

      // End replace, then continue with data replacement.
      if (!tag) {
        readDom($, data, callback);

        return;
      }

      // Get attribute src.
      let src = $(tag).attr("src");

      let fragment = false;

      if ($wt.file.existsSync(src)) {

        // Convert content in dom object.
        fragment = cheerio.load($wt.file.readFileSync(src, 'utf8'), {
          normalizeWhitespace: true
        });

      }

      // Replace tag by content.
      $(tag).replaceWith((fragment) ? $(fragment("html").html()) : $(" "));

      // Process next tag.
      replaceInclude();

    };

    replaceInclude();

  };

  /**
   * MAIN SCRIPT.
   *
   * @param filePath
   * @param options
   * @param response
   */

  const template = async (filePath, options = {}, response) => {

    // Any other placeholder.
    options = $wt.merge($wt.config.template.placeholder, options);

    // Default content.
    let html = false;

    // Check if file exist :-)
    if ($wt.file.existsSync(filePath)) {
      html = $wt.file.readFileSync(filePath, 'utf8');
    }
    else {
      response("Template not found");

      return;
    }

    // Apply first pass of placeholder.
    // Maybe there is some path reference or init value.
    html = placeholder.string(html, options);

    // Convert string to dom for easy matching tag and attributes.
    let $ = cheerio.load(html, {
      normalizeWhitespace: true
    });

    // Replace any include tag by there content.
    // TODO: /<\s*include[^>]*>(.*?)(<\s*/\s*include>)?/g ???
    include($, options, response);

  };

  /**
   * EXPOSE API
   *
   * @param filePath
   * @param replace
   * @returns {Promise}
   */

  $wt.template = (filePath, replace = {}) => {

    let path = $wt.path.resolve(filePath);

    return new Promise( (resolve, reject) => {
      template(filePath, replace, (error, content) => {
        error ? reject(path) : resolve(content)
      })
    });

  };

  /**
   * EXPOSE API - ADD
   * - Extra function to add any json data into the placeholder define by user.
   * - EX: during authenticate action you wish to add extra parameter to be use inside the template engine.
   *
   * @param data
   */

  $wt.template.add = data => {

    // FUNCTION = add extra process or markup.
    if (typeof data === "function") {
      $wt.config.template.custom.push(data);
    }

    // STRING = path to cache others template files.
    else if (typeof data === "string") {
      // TODO?
    }

    // JSON = Add extra placeholder.
    else {
      $wt.config.template.placeholder = $wt.merge($wt.config.template.placeholder, data);
    }

  };

  /**
   * -----------------------------------------------------------------------------------
   * CREATE PROCESS RENDERING FLOW
   * -----------------------------------------------------------------------------------
   * - Order is important
   */

  /**
   * Buffer some elements to preserve code format.
   */

  $wt.template.add(($, data) => {

    $("textarea, pre, code").each( (index, el) => {

      // Give unique id.
      let bufferid = 'BUFFER_'+index;

      // Push to the placeholder array.
      data[bufferid] = "" + $(el).html() + "";

      // Add placeholder to the content.
      $(el).html('{'+bufferid+'}');

    });

  });

  /**
   * DATA-SHOWIF
   * We remove element that don't have any data references.
   */

  $wt.template.add(($, data) => {

    $("[data-showif]").each( (index, el) =>  {

      // Both should be check.
      let attr = $(el).attr("data-showif").replace(/{|}/g,'');

      // Any cases remove attribute "showif".
      $(el).removeAttr("data-showif");

      // if not exist?
      let ifNotExist = attr.startsWith('!');
      let isDeeper = attr.split(".");

      if (data[attr] === null) {
        //console.log(attr, data[attr]);
        $(el).replaceWith($(" "));
      }

      // Maybe it contains {toto.tutu} || toto.tutu ?
      else if (isDeeper.length > 1) {
        //console.log(attr);
      }

      else if ((ifNotExist &&  data[attr.replace('!','')]) || (!ifNotExist && !data[attr])) {
        $(el).replaceWith($(" "));
      }

    });

  });

  /**
   * DATA-FOREACH
   */

  $wt.template.add(($, data) => {

    const loop = (dom, json, index) => {

      // Get the name of "node" object. {toto} => toto.
      let name = $(dom).attr("data-foreach");

      if (name) {
        name = name.replace(/{|}/g, '');
      }
      else {
        return;
      }

      // Remove attribute.
      $(dom).removeAttr("data-foreach");

      // Convert source dom element to reusable dom.
      let nodeString = $.html($(dom));

      // Data exist?
      let dataReference = json[name];

      // Get  real data.
      if (index !== undefined) {

        let plot = name.split(".");

        dataReference = json[plot[1]];

        nodeString = nodeString.replace(/\{*([\w_\-\.]+)*\}/g, (key, name) => {
          return key.replace(plot[0]+".","");
        });

      }

      // Only for array object or array collection.
      if (Array.isArray(dataReference)) {

        // For each of them.
        dataReference.forEach((ref, index) => {

          let newString = '';

          // Array collection
          if (typeof ref === 'object') {
            ref.x = index+1;
            newString = placeholder(nodeString, ref, false);
          }

          // Simple array
          else {
            let newData = [];
            newData["x"] = index+1;
            newData[name] = ref;
            newString = placeholder(nodeString, newData, false);
          }

          let newDom = $(newString);

          $(dom).parent().append(newDom);

          let isNested = $(newDom).find("[data-foreach]").eq(0);

          if (isNested.length) {
            loop(isNested, ref, index);
          }

        });

        // Remove node.
        $(dom).replaceWith($(" "));

      }
      else {

        // Remove node.
        $(dom).replaceWith($(" "));

      }

      let next = $("[data-foreach]")[0];
      if (next) {
        loop(next, data);
      }

    };

    loop($("[data-foreach]")[0], data);

  });

};
