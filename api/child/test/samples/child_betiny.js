/**
 * COOL?
 */

/*
require("../../../betiny.js")( async ($wt, {log: false}) => {

  $wt.db.mysql("betiny").query("SELECT * FROM users").then( result => {
    console.log("result", result);
  });*/

  // Message from parent.
  process.on("message", msg => {
    process.send("Thank you dady!");
  });

  let counter = 0;

  setInterval(() => {
    process.send({ counter: counter++ });
    if (counter > 2) {
      process.send("End");
      process.exit();
    }
  }, 100);

//});

