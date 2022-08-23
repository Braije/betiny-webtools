# EXTEND - NUTS
Heuu ...

## Features
- Rest api serving geographical data as GEOJSON or PROTOBUFF
- Download and import from EUROSTAT
- Mysql is used to store data.
- Demo

## Install

A) Create and install mysql database

    yarn start nuts:install

B) Import all countries, nuts and labels (7 min with download).

    yarn start nuts:import

The import script take into account UPDATE and/or INSERT.
You can also specify some arguments.

    yarn start nuts:import year:xxxx precision:yy level:zzzz

## Remark
- Download files are store in TEMP_PATH + "/nuts"
- Remove files from TEMP_PATH + "/nuts" folder for a fresh install

...


