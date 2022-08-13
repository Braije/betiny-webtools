/**
 * SYSTEM COLLECTION
 */

const UglifyJS = require('uglify-es');
const cleanCSS = require('clean-css');
const fs = require('fs');
const path = require('path');

module.exports = $wt => {

  /**
   * EXTEND API
   */

  $wt.extend({

    /**
     * CLEAN FOLDER
     * Allow you to delete files base from AGE
     *
     * @param folder {string}
     * @param parameters {object}
     * @returns {Promise<Array>}
     */

    cleanFolder: async (folder, parameters = {}) => {

      // References.
      let params = $wt.merge({
        dir: false,
        days: false,
        hours: false,
        mins: false,
        seconds: false
      }, parameters);

      // Resolve path.
      folder = path.resolve(folder);

      // Security check, only temp folder path
      if (folder.indexOf(process.env.TEMP_PATH) !== 0 || process.env.TEMP_PATH === '') {
        console.log("only TEMP folder is allowed");
        return [];
      }

      let now = Date.now();

      let dir = await fs.promises.readdir(folder).catch(() => {
        console.log("Path not found");
        return [];
      });

      let result = [];

      dir.forEach(async fileName => {

        let stats = await fs.statSync(folder + '/' + fileName);
        let time = stats.mtime.getTime();
        let isDir = stats.isDirectory();

        if (params.dir === false && isDir) {
          return;
        }

        let diff = now - time;

        let days = Math.floor(diff / (1000 * 60 * 60 * 24));
        diff -= days * (1000 * 60 * 60 * 24);

        let hours = Math.floor(diff / (1000 * 60 * 60));
        diff -= hours * (1000 * 60 * 60);

        let mins = Math.floor(diff / (1000 * 60));
        diff -= mins * (1000 * 60);

        let seconds = Math.floor(diff / (1000));

        let toDelete = false;

        if (params.days) {
          toDelete = params.days < days;
        }
        else if (params.hours) {
          toDelete = params.hours < hours;
        }
        else if (params.mins) {
          toDelete = params.mins < mins;
        }
        else if (params.seconds) {
          toDelete = params.seconds < seconds;
        }

        if (toDelete) {

          fs.unlink(path.join(folder,fileName), err => {
            if (err) {
              if (isDir) {
                fs.rmdirSync(folder, { recursive: true });
              }
            }
          });
        }

        result.push({
          name: fileName,
          date: [days, hours, mins, seconds]
        });

      });

      return result;

    },

    /**
     * MINIFY FILES (JS + CSS + JSON)
     *
     * @param parameters {object}
     */

    minify: async (parameters = {}) => {

      // References.
      let params = $wt.merge({
        type: false,
        files: false,
        content: false,
        path: false,
        placeholder: {}
      }, parameters);

      let ugly = [];
      let fallback = false;

      // Remove empty string.

      if (Array.isArray(params.files)) {
        params.files = params.files.filter(item => {
          return item;
        });
      }

      /**
       * JAVASCRIPT MINIFICATION.
       *
       * @param config
       * @returns STRING
       */

      const js = async config => {

        fallback = "console.log('minify: Missing file');";

        if (Array.isArray(config.files)) {

          params.files.forEach(file => {

            let folderPath = path.resolve((config.path||"") + "" + file);

            if (fs.existsSync(folderPath)) {

              let code = fs.readFileSync(folderPath, "utf8");

              let compress = UglifyJS.minify(code);

              ugly.push(compress.code || '');

            }
            else {
              ugly.push("console.log('minify: Missing file: " + file + "');");
            }

          })
        }

        if (config.content) {

          ugly.push(($wt.config.debug) ? config.content : UglifyJS.minify(config.content, {
            compress: true
          }).code);

        }

        return (ugly.length) ? $wt.placeholder(ugly.join(''), config.placeholder) : fallback;

      };

      /**
       * CSS MINIFICATION
       *
       * @param config
       * @returns {string}
       */

      const css = config => {

        fallback = "/* minify: Missing file */";

        if (Array.isArray(config.files)) {
          config.files.forEach( file => {
            let path = (config.path||"") +""+ file;
            if (fs.existsSync(path)) {
              let code = fs.readFileSync(path, "utf8");
              code = ($wt.config.debug) ? code : (new cleanCSS({
                level: {
                  1: {
                    specialComments: 0
                  }
                }
              }).minify(code)).styles;
              ugly.push(code)
            }
          })
        }

        if (config.content) {
          ugly.push(($wt.config.debug) ? config.content : (new cleanCSS().minify(config.content)).styles)
        }

        return (ugly.length) ? $wt.placeholder(ugly.join(''), config.placeholder || {})  : fallback

      };

      /**
       * JSON MINIFICATION
       * @param config
       */

      const json = config => {

        config.files.forEach( file => {
          let path = (config.path||"") +""+ file;
          if (fs.existsSync(path)) {
            let code = fs.readFileSync(path, "utf8");
            ugly.push(JSON.stringify(JSON.parse(code)))
          }
        });

        return (ugly.length) ? $wt.placeholder(ugly.join(''), config.placeholder)  : fallback

      };

      /**
       * CHECK ARGUMENTS
       */

      if (params.type === 'js') {
        return await js(params);
      }

      if (params.type === 'css') {
        return await css(params);
      }

      if (params.type === 'json') {
        return await json(params);
      }

    }

  });

};
