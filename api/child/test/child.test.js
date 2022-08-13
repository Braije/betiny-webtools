
module.exports = async $wt => {

  /**
   * TEST QUEUE JOB
   */

  $wt.job("Test CHILD PROCESS", {
    continue: false
  })
  .task("Running external process", async () => {

    let test = 0;

    return await new Promise( (resolve, reject) => {

      const child = $wt.process.fork(__dirname + "/samples/child_betiny.js");

      child.on("message", () => {
        test++;
      });

      child.on('error',reject);

      child.on('exit', () => {

        if (test === 5) {
          resolve(true);
          return;
        }

        resolve(false);
      });

      child.send({ hello: "world" });

    });

  }).execute(() => {
    $wt.next();
  });

  /*

  child.on('error',(code, signal) => {
    console.log("error", code, signal)
  });

  child.on('exit', code => {
    console.log("Child process exit", code);
  });

  child.send({ hello: "world" });
/**/


};
