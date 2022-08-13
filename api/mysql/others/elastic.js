/**
 * TODO: Should be review.
 * DATABASE - ELASTIC SEARCH.
 */

const { Client } = require('@elastic/elasticsearch')

module.exports = $wt => {

  /**
   * CONNECTION
   * @private
   */

  const client = new Client({
    // The Elasticsearch endpoint to use.
    node: process.env.ELASTIC_SEARCH,
    // Max number of retries for each request.
    maxRetries: 3,
    // Max request timeout for each request.
    requestTimeout: 10000,
    // Perform a sniff once the client is started.
    sniffOnStart: true,
    // Your authentication data. You can use both basic authentication and ApiKey.
    _auth: {
      username: 'elastic',
      password: 'changeme'
    },
    // Adds accept-encoding header to every request.
    suggestCompression: true,
    // Enables gzip request body compression.
    compression: 'gzip',
    // function to generate the request id for every request, it takes two parameters,
    // the request parameters and options.
    // By default it generates an incremental integer for every request.
    _generateRequestId: (params, options) => {
      console.log(params)
      // your id generation logic
      // must be syncronous
      return Math.random().toString(36).substr(2, 16)
    },
    // The name to identify the client instance in the events.
    name: 'betiny'

  })

  /**
   * STATUS.
   * @private
   */

  client.ping({}, error => {
    if (error) {
      console.log('elasticsearch cluster is down!')
    }
  });

  /**
   * WRAPPER
   * @public
   */

  $wt.db.elastic = (table, index) => {

    // Original Client in case...
    this.client = client

    // Get a document base from id or config.id
    this.get = config => {

      let request = {
        index: table,
        id: config.id || config
        //,_source: ["id","un"]
      }

      if (config.fields) {
        request._source = config.fields
      }

      return client.get(request).then( result => {
        return result.body._source
      }).catch( error => {
        return {}
      })

    }

    // Add document to table.
    this.add = data => {

      data.id = data.id || Math.random().toString(36).substr(2, 16)

      let request = {
        index: table,
        body: data,
        // If id = erase if already exist.
        id: data.id
      }

      return client.index(request)

    }

    // Delete one or more document in one step.
    this.delete = id => {

      let request = {
        index: table,
        id: id // can be an array ['toto','tutu']
      }

      return client.delete(request)

    }

    // Using query language of Elastic.
    this.search = (query = {}) => {

      let request = {...{
        index: table
      }, ...query}

      delete request.search

      return client.search(request).then( result => {
        let list = []
        result.body.hits.hits.forEach( data => {
          list.push({...{id: data._id}, ...data._source})
        })
        return list
      }).catch( error => {
        return []
      })

    }

    // Using SQL query transpiler of Elastic.
    this.query = query => {

      return client.sql.query({
        body: {
          query: query
        }
      }).then( result => {

        return result.body.rows.map(row => {
          const obj = {}
          for (var i = 0; i < row.length; i++) {
            obj[result.body.columns[i].name] = row[i]
          }
          return obj
        })

      }).catch (error => {
        return []
      })

    }

    // Create or update an index (define columns and type).
    this.index = columns => {
      return client.indices.putMapping({
        index: table,
        body: {
          properties: columns
        }
      })
    }

    // Shortcut to create and index database in one step.
    this.create = async columns => {

      let toto = await client.indices.create({
        index: table
      }).then( () => {
        if (columns) {
          return client.indices.putMapping({
            index: table,
            body: {
              properties: columns
            }
          })
        }
        else {
          return toto
        }
      })

      return toto

    }

    // Destroy a table (index).
    this.destroy = () => {
      return client.indices.delete({
        index: table // can be an array ['toto','tutu']
      }).then( () => {
        return true
      }).catch( () => {
        return false
      })
    }

    return this

  }

  /**
   * TEST
   */

  $wt.config.ready.push( async () => {

    // console.clear()

    /* ADD
    let add = await $wt.db.elastic("spaces").add({
      name: 'zorro',
      date: Date.now(),
      bool: false,
      //blob: '',
      //labels: { toto: 'tutut', tata: 'titi' },
      //location: [50,11],
      //geo: { type: 'geo_shape' },
      //ip_addr: '127.0.0.1',
      //nested: { nest1: 'ed1', nest2: 'ed2' },
      numeric: 956,
      //object: { toto: { type: 'interger' }, xxx }
      //asyou: {type:'search_as_you_type'},
      content: '<p>cool <b>un</b> truc tata</p>'
    })
    /* */

    /* DELETE
    let delz = await $wt.db.elastic("toto").delete('tophe2');
    console.log(delz);
    /* */

    /* GET
    //let get = await $wt.db.elastic("toto").get({id: 'tophe', fields: ['id','un']});
    let get = await $wt.db.elastic("toto").get('tophe');
    console.log(get);
    /* */

    /* SEARCH
    let search = await $wt.db.elastic("spaces").search({
      body: {
          query : {
            match_all: {}
          }
        }
      ,size: 10
      //,_source: ["DestCityName"]
      //,sort: ["DestCityName:asc"]
    })
    console.log(search)
    /* */

    /* QUERY
    let query = await $wt.db.elastic().query("SELECT id, firstname FROM users ORDER BY firstname ASC")
    //let query = await $wt.db.elastic().query("SHOW TABLES")
    //let query = await $wt.db.elastic().query("SHOW COLUMNS IN spaces")
    //let query = await $wt.db.elastic().query("SELECT DestCityName FROM kibana_sample_data_flights ORDER BY DestCityName ASC LIMIT 10")
    //let query = await $wt.db.elastic().query("SELECT COUNT(DestCityName) AS total FROM kibana_sample_data_flights")
    //let query = await $wt.db.elastic().query("SELECT DestCityName FROM kibana_sample_data_flights GROUP BY DestCityName ORDER BY DestCityName ASC LIMIT 5")
    //let query = await $wt.db.elastic().query("SHOW COLUMNS IN kibana_sample_data_flights")
    //let query = await $wt.db.elastic().query("SELECT numeric, name, date FROM spaces WHERE numeric > 300 ORDER BY name ASC")
    console.log(query)
    /* */

    /* DELETE DATABASE
    let del = await $wt.db.elastic("spaces").destroy()
    console.log(del)
    /* */

    /* CREATE DATABASE + INDEX
    await $wt.db.elastic("spaces").create({
      name: { type: 'keyword' },          // keyword for search
      date: { type: 'date_nanos' },       // mills
      bool: { type: 'boolean' },          // true/false
      //blob: { type: 'binary' },           // string to base64
      //labels: { type: 'flattened' },      // Free object ^^
      //location: { type: 'geo_point' },    // [lat,long]
      //geo: { type: 'geo_shape' },       // { geometry: ..., properties: ...}
      //ip_addr: { type: 'ip' },            // 127.0.0.1
      //nested: { type: 'nested' },         // { }
      numeric: { type: 'long' },          // A signed 64-bit integer
      //object: { type: 'object' },         // { toto: { type: 'interger' }, xxx }
      //asyou: {type:'search_as_you_type'}, // for queries that serve an as-you-type completion use case
      content: { type: 'text' }         // content XHTML - no-indexed
    })
    /* */

  })

  $wt.next("CORE - ELASTIC SEARCH")

}
