/**
 * ALIAS COLLECTION
 */

const axios = require('axios');
const fs = require('fs');

module.exports = $wt => {

  /**
   * EXTEND API
   */

  $wt.extend({

    request: axios,

    file: fs

  });

};
