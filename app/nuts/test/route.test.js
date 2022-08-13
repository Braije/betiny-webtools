/**
 * TEST
 */

module.exports = $wt => {

  $wt.job("NUTS - route", {
    continue: false
  })

  // TODO: Should be improve :-)
  .task("Test route", async cfg => {

    let params = {
      countries: "fr-",
      scale: 60,
      level: false,
      year: 2013
    };

    let url = "http://127.0.0.1:3000/webtools/rest/nuts";

    let result = await $wt.request.get(url + "?countries=fr-&scale=60M&year=2013&level=false").catch(() => {
      return {data: {features: []}};
    });

    let sql = await $wt.db.mysql('nuts').query([
      "SELECT feature FROM geojson WHERE ",
      " cntr_id IN ('"+ params.countries.split(',').join("','") +"') AND ",
      " year=? AND scale=? AND level=?"
    ].join(''), [
      params.year,
      params.scale,
      (params.level === false) ? 4 : params.level
    ]).catch(() => {
      return [];
    });

    return sql.length === result.data.features.length;

  })

  .execute();

};
