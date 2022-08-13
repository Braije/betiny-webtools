/**
 * INSTALL
 */

module.exports = async $wt => {

  await $wt.db.mysql.install({
    file: __dirname + '/install.sql',
    dbname: 'nuts'
  });

};
