/**
 * TEST
 */

module.exports = $wt => {

  $wt.job("NUTS - database", {
    continue: false
  })
  .task("Table geojson exists", async cfg => {

    let test = true;

    await $wt.db.mysql('nuts').query("SELECT * FROM geojson LIMIT 0,1").catch( error => {
      test = false;
    });

    return test;

  })
  .execute();

};
