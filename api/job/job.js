/**
 * JOB
 * Similar to queue but each element of the queue should return
 * a boolean value to process next one.
 *
 * SYNTAX
 *
 *    $wt.job("Description of JOB", PARAMS)
 *      .add("Task description", FUNCTION)
 *      .add("Another description task, [FUNCTION, FUNCTION])
 *      .execute( (total, error) => {
 *        ...
 *      });
 *
 */

module.exports = $wt => {

  const write = message => {
    //process.stdout.moveCursor(0,-3);
    process.stdout.cursorTo(0);
    process.stdout.clearLine();
    process.stdout.write(message);
  };

  $wt.job = (name, config = {}) => {

    /**
     * REFERENCES.
     */

    this.tasks = [];
    this.name = name;
    this.count = 1;
    this.total = 0;
    this.error = [];
    this.progress = false;
    this.params = {};

    /**
     * PRIVATE
     *
     * @returns {Promise<void>}
     */

    const queue = async () => {

      if (this.progress) {
        return;
      }

      this.progress = true;

      // The file to be load.
      let item = this.tasks[0];

      if (item) {

        this.tasks = this.tasks.slice(1, this.tasks.length);

        if (config.console !== false) {
          write(" \033[90m└──\033[32m RUN \033[0m" + item.description);
        }

        this.params = await item.job(this.params);

        setTimeout( () => {

          if (this.params) {

            this.progress = false;

            this.count++;

            if (config.console !== false) {
              write('');
              $wt.log("  \033[90m└─\033[32m ✔ \033[90m" + item.description);
            }

            setTimeout(queue, 125);

          }

          // ERROR
          else {

            this.error.push(item.description);

            if (config.continue) {

              if (config.console !== false) {
                write('');
                $wt.log("  \033[90m└─\033[31m ✔ \033[0m" + item.description);
              }

              this.progress = false;

              setTimeout(queue, 125);

            }
            else {

              if (config.console !== false) {
                write('');
                $wt.log("  \033[90m└─\033[31m × \033[0m" + item.description);
              }

              console.log("\033[90m----------------------------------------\033[0m");
              process.exit();
            }

          }

        }, 125);

      }

      // End of job.
      else {

        if (this.callback) {
          this.callback(this.total, this.error);
        }

        this.tasks = [];
        this.name = name;
        this.count = 1;
        this.total = 0;
        this.error = [];
        this.progress = false;
        this.params = {};

        // Implicite call at the end of each job for install and test.
        if ($wt.next) {
          $wt.next();
        }

      }

    };

    /**
     * PRIVATE
     *
     * @param desc
     * @param fnc
     */

    const add = (desc, fnc) => {

      // Increment counter.
      this.total++;

      // Push to job queue.
      this.tasks.push({
        description: desc,
        job: fnc
      });

    };

    /**
     * PUBLIC
     *
     * @param desc
     * @param fnc
     * @returns {*}
     */

    this.task = (desc, fnc) => {

      // As array => Push every task in job queue.
      if (Array.isArray(fnc)) {
        fnc.forEach( (item, index) => {
          add(desc + " | " + (index+1), item);
        });
      }

      // As single task;
      else {
        add(desc, fnc);
      }

      return this;

    };

    /**
     * PUBLIC
     *
     * @param fnc
     */

    this.execute = fnc => {

      this.callback = fnc;

      if (config.console !== false) {
        $wt.log("\033[35m JOB:\033[0m " + this.name ); //+ " | \033[33mNBR TASKS:\033[0m " + this.total);
      }

      queue();

    };

    return this;

  };

};
