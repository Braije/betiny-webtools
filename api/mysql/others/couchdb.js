/**
 * TODO: Should be review.
 * COUCHDB - NANO
 * - https://www.npmjs.com/package/nano
 *
 * TRANSPILER SQL
 * - https://www.npmjs.com/package/cloudant-quickstart
 * - https://github.com/ibm-watson-data-lab/nodejs-cloudant-quickstart
 */

const url = [
  'http://',
  process.env.COUCHDB_USER,':',
  process.env.COUCHDB_PASSWORD,'@',
  process.env.COUCHDB_HOST,':',
  process.env.COUCHDB_PORT
].join('')

const agentkeepalive = require('agentkeepalive');
const nano = require('nano')({

  url: url,

  // You can tell nano to not parse the URL (maybe the server is behind a proxy,
  // is accessed through a rewrite rule or other)
  parseUrl : false,

  requestDefaults : {
    "agent" : new agentkeepalive({
      maxSockets: 50,
      maxKeepAliveRequests: 0,
      maxKeepAliveTime: 30000
    })
    //,"_proxy" : "http://someproxy"
  },

  _log: (id, args) => {
    console.log(id, args);
  }

});

//const cloud = require('cloudant-quickstart')(url, 'users');
//const sqltomango = require('sqltomango');

module.exports = $wt => {

  // MAIN WRAPPER
  const couch = table => {

    // Don't care about API wrapper, return native engine.
    if (!table) {
      return nano
    }

    // Otherwise use "table".
    const connector = nano.use(table)

    // Custom update method.
    connector.update = (id, doc) => {

      // A - GET DOCUMENT FIRST
      return connector.get(id).then( body  => {

        // B - OVERWRITE VALUE BY MERGE
        this.target = {...body,...doc}

        delete this.target._rev;

        // C - DELETE ORIGINAL
        return connector.destroy(id, body._rev)

      }).then( body  => {

        // D - INSERT NEW DOC IN DATABASE
        return connector.insert(this.target)

      })

    }

    // Custom delete method.
    connector.delete = id => {
      // A - GET INFO BASE FROM ID
      return connector.get(id).then( result => {
        // B - USE REV TO DELETE
        return connector.destroy(id, result._rev)
      })
    }

    // Custom add method.
    connector.add = json => {
      let data = (!json._id) ? {...json, ...{
        _id: Math.random().toString(36).substr(2, 16)
      }} : json
      return connector.insert(data)
    }

    // Custom get method (original API).
    // connector.get = connector.get

    return connector

  }

  // Expose.
  $wt.db.couch = couch

  // Test.
  $wt.config.ready.push( async () => {

    //console.clear()
    //console.log("COUCHDB", cloud.query.toString())

    //let toto = await cloud(url + '/users').query('SELECT * FROM users')
    //let toto = await cloud.explain("SELECT * FROM users WHERE name LIKE '%t%'")
    //let toto = sqltomango.parse("SELECT * FROM dogs WHERE owner = 'glynn'")
    //let toto = sqltomango.parse("SHOW COLUMNS IN users")
    //console.log(toto)

    /* DOC - UPDATE
    await $wt.db.couch("users").update('htexhqufxd5', { test: 'what-3' }).then( result => {
      console.log(result)
    }).catch( error => {
      console.log(e.reason)
    })
    /* */

    /* DOC - GET
    await $wt.db.couch("users").get('htexhqufxd5').then( result => {
      console.log(result)
    }).catch( e => {
      console.log(e.reason)
    })
    /* */

    /* DOC - ADD
    await $wt.db.couch("users").add({
      name: 'toto_' + Math.random().toString(36).substr(2, 16),
      date: Date.now(),
      number: Math.floor(Math.random() * 100)
    }).then( result  => {
      console.log(result)
    }).catch( error => {
      console.log(error.reason)
    })
    /* */

    /* DOC - DELETE
    await $wt.db.couch("users").delete('10i5ovobnhc').then( result => {
      console.log(result)
    }).catch( error => {
      console.log(error.reason)
    })
    /* */

    /* CREATE INDEX
    await $wt.db.couch("users").add({
      _id: "_design/users_date",
      language: "query",
      views: {
        users_date: {
          map: {
            fields: {
              date: "asc"
            },
            partial_filter_selector: {}
          },
          reduce: "_count",
          options: {
            def: {
              fields: ["date"]
            }
          }
        }
      }
    }).then( result  => {
      console.log(result)
    }).catch( error => {
      console.log(error.reason)
    })
    /*  */

    /* DOC - SEARCH
    $wt.db.couch("users").find({
      selector: {
        name: { "$regex": "toto"},
        number: { "$gt" : 5 }
      }
      ,fields: ["date","number","_id"]
      ,limit: 5
      ,sort: [{"date": "desc"}]
    }).then( result => {
      console.clear()
      console.log(result)
    }).catch( error => {
      console.log(error.reason)
    })
    /* */



    /* DATABASE - CREATE
    $wt.db.couch.db.create('spaces').then( () => {
      return true
    }).catch( () => {
      return true
    })
    /* */

    /* DATABASE - DESTROY
    $wt.db.couch.db.destroy('folders').then( () => {
      return true
    }).catch( () => {
      return false
    })
    /* */

    /* DATABASE - LIST
    $wt.db.couch.db.list().then( body => {
      console.log(body)
    }).catch( () => {
      return false
    })
    /* */

    /* DATABASE - INFO
    $wt.db.couch.db.get('users').then( body => {
      console.log(body);
    })
    /* */



    /* GET DOCUMENT BY ID
    await $wt.db.couch.use("users").get('htexhqufxd5').then( body  => {
      console.log(body)
      return true
    }).catch( error => {
      return error
    })
    /* */

    /* UPDATE DOCUMENT YAHOUUU
    let update = await $wt.db.couch.use("users").update("mschu0nc4yl", {un:"truc2"});
    console.log(update)
    /* */

    /* LIST OF ALL DOCUMENT
    let list = await $wt.db.couch.use("users").list({ limit: 5});
    console.log(list.rows)
    /* */

    /* BULK
    const dbname = 'mydb'
    await nano.db.create(dbname)
    const db = nano.db.use(dbname)
    const documents = [ {a:1, b:2}, {a:2, b:3}, {a:3, b:4} ]
    await db.bulk({ docs: documents })
    /* */

    /* SEARCH
    await $wt.db.couch.use("users").find({
      selector: {
        name: { "$eq": "braijch"}
      },
      //fields: ["_id","name"],
      limit: 3
    }).then( body => {
      console.log(body)
    })
    /**/

    /* SESSION INFO COOKIE
    $wt.db.couch.session().then((doc) => {
      console.log(doc)
    });
    /* */

  })

  $wt.next("CORE - COUCHDB (nano)")

}
