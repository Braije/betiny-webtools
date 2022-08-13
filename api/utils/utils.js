/**
 * UTILS COLLECTION
 */

module.exports = $wt => {

  /**
   * EXTEND API
   */

  $wt.extend({

    /**
     * ITERATE
     * Create all combination between several array by key reference.
     *
     * SYNTAX:
     *
     *   let xxxx = iterate({
     *     key: [1,2],
     *     others: [3,4]
     *   });
     *
     * RESULT:
     *
     *  [
     *    { key: 1, others: 3},
     *    { key: 1, others: 4},
     *    { key: 2, others: 3},
     *    { key: 2, others: 4}
     *  ]
     */

    iterate: (master, result = [{}]) => {

      // References.
      let masterKeys = Object.keys(master);
      let nextKey = masterKeys.pop();
      let nextValue = master[nextKey];
      let newObjects = [];

      // Build newObjects reference.
      for (let value of nextValue) {
        for (let x of result) {
          newObjects.push(Object.assign({ [nextKey]: value }, x));
        }
      }

      if (masterKeys.length === 0) {
        return newObjects;
      }

      let masterClone = Object.assign({}, master);
      delete masterClone[nextKey];

      return $wt.iterate(masterClone, newObjects);

    },

    /**
     * TRIVIAL LOG
     * Can be improve later to log inside file or DB
     *
     * @param args
     */

    log: (...args) => {
      console.log.apply(this, args);
    },

    /**
     * MERGE
     * Allow you to merge 2 JSON object.
     *
     * @param defaultJSON
     * @param customJSON
     * @returns {*}
     */

    merge: (defaultJSON, customJSON) => {

      (function recursive (a, b) {
        for (var k in b) {
          if (b.hasOwnProperty(k)) {
            if (a[k] === null) {
              a[k] = undefined;
            }
            if (typeof b[k] === "function" || typeof b[k] === "string" || typeof b[k] === "number" || typeof b[k] === "boolean" || b[k] === null ||
              (typeof b[k] === "object" && (typeof a[k] === "string" || typeof a[k] === "number" || typeof a[k] === "boolean"))) {
              a[k] = b[k];
            }
            else if (typeof b[k] === "object") {
              if (!a[k]) {
                if (b[k].length !== undefined) {
                  a[k] = [];
                }
                else {
                  a[k] = {};
                }
              }
              recursive(a[k], b[k]);
            }
          }
        }
      }(defaultJSON, customJSON));

      return defaultJSON;

    },

    /**
     * QUEUE
     * Alllow you to push in queue any function ...
     * each of them will be execute one by one.
     * The goal is to avoid an overlapping memory usage like
     * usual with any promise approach or classic loop method.
     *
     * SYNTAX
     *
     *    let myQueue = $wt.queue(OPTIONS);
     *    myQueue.push([fnc,fnc...]);
     *    myQueue.push(fnc);
     *    myQueue.execute(callback);
     *
     * NOTE: each return value is forward to the next method as
     * parameter.
     */

    queue: (config = { delay: 25 }) => {

      let _cache = [], timer;

      this.push = fnc => {
        // As array.
        if (Array.isArray(fnc)) {
          _cache = _cache.concat(fnc);
        }
        else if (typeof fnc === 'function') {
          _cache.push(fnc);
        }
      };

      this.execute = fnc => {

        const run = async result => {

          let exec = _cache[0];

          _cache.shift();

          if (typeof exec === 'function') {
            let data = await exec(result);
            clearTimeout(timer);
            timer = setTimeout( () => {
              run(data);
            }, config.delay);
          }
          else if (typeof fnc === 'function') {
            fnc();
          }

        };

        setTimeout(run, config.delay);

      };

      return this;

    }

  });

};
