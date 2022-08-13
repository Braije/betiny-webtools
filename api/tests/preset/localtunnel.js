/**
 * FUNNY
 * Create tunneling for your local process to be accessible from outside :p
 */

const localtunnel = require('localtunnel');

module.exports = async $wt => {

  /**
   * TUNNELING
   * Bypass page, set header to 'Bypass-Tunnel-Reminder: any-value'
   * TODO: apply only for local test :p
   */

  const tunnel = await localtunnel({
    port: process.env.SERVER_PORT,
    subdomain: "webtools"
  });

  process.env.PUBLIC_URL = process.env.PUBLIC_URL || tunnel.url;

  /**
   * JOB PROCESS
   */

  $wt.job("Local tunnel")

  .task("Create tunnel: " + tunnel.url, async () => {
    return true;
  })
  .execute();

};
