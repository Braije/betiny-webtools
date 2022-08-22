/**
 * TEST
 */

module.exports = $wt => {

  $wt.job("ETRANS", {
    continue: false
  })
  .task("Make a request", async cfg => {

    let urlEtrans = 'http://localhost.europa.eu:3000/webtools/rest/etrans';

    let test = await $wt.request.post(urlEtrans + '/translate?id=1', {

      textToTranslate: "Bon année!",
      sourceLanguage: "fr",
      targetLanguage: "en",
      domain: "spd"

    }).catch(error => {
      return false;
    });

    return test;

  })
  .execute();

};
