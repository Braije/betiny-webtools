/**
 * STRING COLLECTION
 */

module.exports = $wt => {

  /**
   * EXTEND API
   */

  $wt.extend({

    /**
     * Lite templating.
     *
     * @example
     * $wt.template("<h2>{uppercase:hello} <span>{name}</span></h2>", {
     *
     *  "hello" : "Hi, ",
     *  "name" : "Christophe"
     *
     * });
     *
     * @param str {string} => XHTML AS STRING WITH {name}
     * @param placeholders {Object} => JSON OBJECT WHO'S CONTAIN { "name" : "toto" }
     * @param options {object} => JSON OBJECT for refine parameters
     *
     * @returns STRING XHTML
     */

    template: (str, placeholders, options) => {

      // Use only with String.
      if (typeof str !== 'string') {
        return '';
      }

      // Advanced options.
      var opt = $wt.merge({

        preserve: false,

        transform: function (res) {
          if (typeof res === 'object') {
            return JSON.stringify(res);
          }

          return res;
        },

        methods: {
          uppercase: function (res) {
            return res.toUpperCase();
          },
          lowercase: function (res) {
            return res.toLowerCase();
          },
          ceil: function (res) {
            return Math.ceil(res);
          },
          round: function (res) {
            return Math.round(res);
          },
          floor: function (res) {
            return Math.floor(res);
          },
          decimal: function (res, args) {
            return Number(res).toFixed(args[0] || 2);
          },
          tostring: function (res) {
            return JSON.stringify(res);
          }

          // TODO: possible improvements: ucfirst, date, reduce, reverse, split, sort, asc, desc
        }

      }, options || {});

      // @codingStandardsIgnoreLine
      return str.replace(/{([\w_\-\:\.\(\)]+)}/g, function (key, name) {

        // Use Method?
        // {xxx:placeholder} => ["xxx","placeholder"].
        // {xxx(1,2,3):placeholder} => ["xxx(1,2,3)","placeholder"].
        var useMethod = key.replace(/{|}/g,'').split(':');

        // Arguments?
        // {xxx(1,2,3):placeholder} => xxx
        var useArguments = useMethod[0].split('(');

        // Method name as action.
        // {xxx(1,2,3):placeholder} => xxx
        var action = useArguments[0];

        // Arguments.
        // 1,2,3) => [1,2,3]
        var args = (useArguments[1] || '').split(')')[0].split(',');

        // Label
        // {xxx:zzz} => zzz.
        var label = useMethod[1] || useMethod[0];
        var labelValue = placeholders[label];

        // Placeholder value.
        var placeholder = labelValue;

        // Deep notation.
        // {toto.tutu}
        // {uppercase:toto.tutu}
        if (label.split('.').length > 1) {
          placeholder = label.split(".").reduce(function (prev, curr) {
            return prev && prev[curr];
          }, placeholders);
        }

        // Drop only these value.
        if (["undefined", "null"].indexOf(String(placeholder)) > -1) {
          return "";
        }

        // We want to preserve the placeholder if no value is provided.
        if (opt.preserve && !placeholder) {
          return "{" + name + "}";
        }

        // No value, remove it.
        else if (!String(placeholder)) {
          return "";
        }

        // Case: {XXX:placeholder}.
        else if (opt.methods[action] && useMethod.length > 1) {
          return opt.methods[action](placeholder, args);
        }

        // Case: {placeholder}.
        else {
          return opt.transform(placeholder);
        }

      });
    },

    /**
     * PLACEHOLDER
     * Allow you to replace some {placeholder} or ___placeholder___ inside string.
     * TODO: review regex ^^
     *
     * @param content {string}
     * @param placeholders {object}
     * @returns {string}
     */

    placeholder: (content, placeholders) => {

      const replace = (k, n) => {

        let placeholder = placeholders[n];

        if (!placeholder && placeholder !== false && placeholder !== 0) {
          return k;
        }

        if (typeof placeholder === 'string') {
          return placeholder;
        }
        else if (typeof placeholder === 'object') {
          return JSON.stringify(placeholder);
        }

        return k;

      };

      let toto = content.replace(/{([\w_\-]+)}/g, (k, n) => {
        return replace(k,n);
      }).replace(/___([\w_\-]+)___/g, (k, n) => {
        return replace(k,n);
      });

      console.log(toto);

      return toto;


    },

    /**
     * HASH
     * Create an unique id base from string
     *
     * @param str
     * @returns {number}
     */

    hash: str => {
      let hash = 5381;
      let i = str.length;
      while(i) {
        hash = (hash * 33) ^ str.charCodeAt(--i);
      }
      return hash >>> 0;
    },

    /**
     * ID
     * Return a random unique id.
     *
     * @returns {string}
     */

    id: () => {
      return Math.random().toString(36).substr(2, 16);
    },

    /**
     * FORMAT BYTES
     *
     * @param bytes
     * @param decimals
     * @returns {string}
     */

    formatBytes: (bytes, decimals = 2) => {

      if (bytes === 0) {
        return '0 Bytes';
      }

      let k = 1024;
      let dm = decimals < 0 ? 0 : decimals;
      let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      let i = Math.floor(Math.log(bytes) / Math.log(k));

      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];

    }

  });

};
