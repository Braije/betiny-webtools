/**
 * MySql 2.0 using Pool
 *
 * HOW TO USE IT
 *
 *  // Syntax.
 *  $wt.db.mysql( TABLE ).query( QUERY, PLACEHOLDER );
 *
 *  // Example.
 *  $wt.db.mysql('security').query("SELECT * FROM security_service").then( result => { ... });
 *
 *  // PLACEHOLDER
 *  $wt.db.mysql('abis').query("UPDATE jobs SET isrunning='2', result=? WHERE id=?", [{ .... }, 123]);
 *
 */

const mysql = require('mysql2');

module.exports = async $wt => {

  // References.
  const poolCluster = [];

  /**
   * SWITCH TO ANOTHER DATABASE ON THE FLY
   *
   * @param database
   * @returns {object} Pool connection
   */

  const switchDatabase = (database = process.env.MYSQL_DATABASE) => {

    // Create the pool connection.
    let pool = mysql.createPool({
      waitForConnections: true,
      queueLimit: 0,
      connectionLimit: process.env.MYSQL_CONNECTION_LIMIT,
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: database,
      port: process.env.MYSQL_PORT
    });

    if (!poolCluster[database]) {
      poolCluster[database] = pool;
    }

    return poolCluster[database];

  };

  /**
   * WRAPPER
   *
   * @param database {string} - TODO: database name
   * @returns {*}
   */

  $wt.db.mysql = database => {

    let pool = switchDatabase(database);

    this.query = (query, placeholder = null) => {
      return new Promise( (resolve, reject) => {
        pool.query(query, placeholder, (error, result) => {
          if (error) {
            return reject(error.sqlMessage);
          }
          resolve(result);
        })
      });
    };

    return this;
  };

  /**
   * UTILITY
   * Allow you to run instruction base from SQL file (dump)
   *
   * @param params
   */

  $wt.db.mysql.install = async params => {

    let file = params.file || false;
    let dbname = params.dbname || false;

    // Check first if exist.
    if(!$wt.file.existsSync(file)) {
      console.log("  \033[90m└─\033[31m × \033[0m", "File not found");
      process.exit();
    }
    else {
      console.log("  \033[90m└─\033[32m ✔ \033[90m", "File found", file.split('/').pop());
    }

    // Load file and split it into instruction.
    let instructions = await $wt.file.readFileSync(file).toString().split(";").filter(command => {
      return command.trim() !== '';
    }).map(command => {
      return command.replace(/\n|\r|  /ig,' ').trim();
    });

    console.log("  \033[90m└─\033[32m ✔ \033[90m", instructions.length + " command(s) found");

    // Create the queue
    let queue = $wt.queue({delay: 25});

    // For each instructions.
    instructions.forEach(command => {

      // We create a queue process.
      queue.push(async () => {

        let run = await $wt.db.mysql(dbname).query(command).catch(error => {
          return false;
        });

        if (run === false) {
          console.log("  \033[90m└─\033[31m × \033[0m", command.slice(0,40) + "...");
        }
        else {
          console.log("  \033[90m└─\033[32m ✔ \033[90m", command.slice(0,40) + "...");
        }

      });

    });

    queue.execute(() => {
      $wt.next();
    });

  };

  /**
   * CATCH EVENTS
   */

  $wt.on('ready', async () => {

    // Check Mysql.
    let mysqlRunning = await $wt.db.mysql().query("SHOW TABLES").catch(() => {
      return false;
    });

    if (mysqlRunning === false) {
      console.log("\033[31m MYSQL:\033[0m ", "TURN YOUR MYSQL ON OR CHECK CONNECTION");
      process.exit();
    }
    else {
      console.log("\033[32m MYSQL:\033[0m\t\t\t", "RUNNING");
    }

  });

};
