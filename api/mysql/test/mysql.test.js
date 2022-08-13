/**
 * TEST MYSQL CONNECTION AND TABLE etc..
 * Trivial and basic test of API and connection.
 */

module.exports = async $wt => {

  $wt.job("Test MYSQL")

  .task("Connection", async cfg => {

    return await $wt.db.mysql().query("SHOW TABLES").catch( error => {
      return false;
    });

  })

  .execute();

};
