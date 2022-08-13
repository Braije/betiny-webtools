
module.exports = async $wt => {

  /**
   * TEST QUEUE JOB
   */

  const toto = cfg => {
    return true;
  };

  const sleep = ms => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };


  $wt.job("Test JOB", {
    continue: true
  })
  .task("Return true process", cfg => {
    return true;
  })
  .task("Using function name reference", toto)
  .task("Use array", [toto,toto])
  .task("Fake long process", async cfg => {
    await sleep(1000);
    return true;
  })
  .task("Continue on error", cfg => {
    return false
  })
  .task("Passing arguments to next task", cfg => {
    return {
      note: "This is my note"
    };
  })
  .task("Catching arguments from previous task", cfg => {
    return cfg.note && cfg.note === 'This is my note';
  })
  .task("Drop another error", cfg => {
    return false;
  })
  .execute(() => {
    $wt.next();
  })

};
