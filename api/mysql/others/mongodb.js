/**
 * TODO: Should be review.
 * DATABASE - MongoDB
 */

const {MongoClient} = require('mongodb');

/**
 * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
 * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
 * TODO: use process.env etc..
 */
const uri = "mongodb://localhost:27017";

module.exports = $wt => {

  // Setup.
  const client = new MongoClient(uri,  { useUnifiedTopology: true });

  // Wrapper.
  $wt.db.mongo = async table => {

    if (!table) {
      return client
    }

    const connector = () => {
      this.db = false
    }

    const connect = uri => {

      var _this = this;

      return new Promise( (resolve, reject) => {
        if (_this.db) {
          // Already connected
          resolve();
        }
        else {
          var __this = _this;

          // Many methods in the MongoDB driver will return a promise
          // if the caller doesn't pass a callback function.
          MongoClient.connect(uri)
          .then(
            function(database) {

              // The first function provided as a parameter to "then"
              // is called if the promise is resolved successfuly. The
              // "connect" method returns the new database connection
              // which the code in this function sees as the "database"
              // parameter

              // Store the database connection as part of the DB object so
              // that it can be used by subsequent method calls.

              __this.db = database;

              // Indicate to the caller that the request was completed succesfully,
              // No parameters are passed back.

              resolve();
            },
            function(err) {

              // The second function provided as a parameter to "then"
              // is called if the promise is rejected. "err" is set to
              // to the error passed by the "connect" method.

              console.log("Error connecting: " + err.message);

              // Indicate to the caller that the request failed and pass back
              // the error that was returned from "connect"

              reject(err.message);
            }
          )
        }
      })
    }

    return connector;

  }

  //client.connect();

  $wt.config.ready.push( async () => {

    return

    //console.clear()

    try {
      // Connect to the MongoDB cluster
      await client.connect( (err, db) => {


      });

      // "CREATE" DATABASE
      const db = await client.db("betiny")
      //db.createCollection("users")

      //console.log( db.collection('users').update )
      //console.log( db.collection('users').find , db.users)

      /* INSERT
      db.collection('users').insertOne({ "name": "christophe" }, (error, success) => {
        //console.log(error, success)
        if (error) {
          console.log("error")
        }
        else {
          //console.log("success", success)
        }
      })
      /* */

      db.collection('users').find({}).toArray(function(error, docs) {
        if (error) {
         console.log("ERRRORRRR")
        }
        else {
          console.log("Found the following records");
          console.log(docs);
        }
      });

      /*
      db.myNewCollection3.createIndex( { y: 1 } )
      db.collection.find()
      db.collection.findOne()
      db.collection.aggregate()
      db.collection.countDocuments()
      db.collection.estimatedDocumentCount()
      db.collection.count()
      db.collection.distinct()
      */

    } catch (e) {
      console.error(e);
    } finally {
      //client.close();
    }

  })

  $wt.next("CORE - MONGODB")

}