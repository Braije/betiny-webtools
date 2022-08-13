/**
 * PROCESS CHILD
 * We use fork for flexibility and exchange between both.
 *
 * HOW TO - FROM PARENT
 *
 *  // Use "child" to forward "app" reference
 *  const child = $wt.process.child("child.js");
 *
 *  // Use "fork" if not necessary
 *  const child = $wt.process.fork("child.js");
 *
 *  child.on("message", msg => { ... });
 *  child.on("error", (code, signal) => { ... });
 *  child.send({ hello: "world" });
 *
 * HOW TO - FROM CHILD ("child.js")
 *
 *  process.on("message", msg => { ... });
 *  process.send({ hello: "world" });
 *  process.exit();
 */

const { exec, fork, spawn } = require('child_process');

module.exports = $wt => {

  // Use to run shell command.
  $wt.process.shell = exec;

  // Use to run child without "app"
  $wt.process.fork = fork;

  // Use to forward "app" to the child process.
  $wt.process.child = file => {
    const mod = require(file);
    if (typeof mod === 'function') {
      mod(app);
    }
  };

};
