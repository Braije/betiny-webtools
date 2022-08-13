/**
 * INSTALL
 */

module.exports = async $wt => {

  let dbname = process.env.MYSQL_DATABASE || 'betiny';

  let create = await $wt.db.mysql()
    .query("CREATE DATABASE IF NOT EXISTS " + dbname + " CHARACTER SET utf8 COLLATE utf8_general_ci")
    .catch(() => {
      return false;
    });

  if (create === false) {
    console.log("  \033[90m└─\033[31m × \033[0m", "FAILED");
  }
  else {
    console.log("  \033[90m└─\033[32m ✔ \033[90m", dbname + " is correctly created");
  }

  // Call this when finish.
  $wt.next();

};
