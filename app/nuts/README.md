# About
This "app" let you:

- import geojson data from EUROSTAT.
- using rest api "/webtools/rest/nuts?xxx"
- install database
- running test

##### Remarks

- TEMP_PATH should be writable (see .env)
- mysql should be running :-)

# How to

## Install

    node server install:nuts

## Running test

    node server test:nuts

## Import

    node app/nuts/import/nuts.import.js

    TODO: node server import:nuts ?

## Adding more iterations

    // ./common/config.js

    import: {
        projection: [4326],
        year: [2010,2013,2016,2021],
        precision: ['60','20','10','03','01'],
        level: [false,0,1,2,3]
    },


