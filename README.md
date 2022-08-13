# Memo
Some ideas to investigate.

    app.get('/**:type(html)' ?
    localtunnel: https://www.pluralsight.com/guides/exposing-your-local-node-js-app-to-the-world

# Architecture

- Clustering ensure by PM2.
- Auto load and configure each services.
- Security: middleware to describe each service:
- Database: MYSQL with pool clustering request, elasticsearch, couchDB ...
- Templating: Custom templating service and events

# Goal

    /api = wrapper methods => $wt
    /app = custom services based on API
    /middleware = custom middleware based on API
    /temp = custom temp storage

# Install

## Remark

Your local environment should contains "europa.eu"
otherwise ECAS login will not work

    http(s)://localhost.europa.eu

Manage your own certificat

    openssl req -nodes -new -x509 -keyout server.key -out server.cert

For the rest simply clone the repository and after that, as usual, install node modules.

    yarn

Rename .env-sample to .env and fill values with your own

    .env (rename, edit and fill it)

Initiate your install app. Some of them need
to install a database etc..

    // Run all (xxx/yyy/install).
    yarn dev install

    // Run only one (xxx/nuts/install)
    yarn dev install:nuts

To run the application

    // Default
    yarn dev

    // On prod use PM2
    // https://github.com/Unitech/pm2
    yarn prod

Run any test

    // Default
    yarn test

## Documentation
TODO

### API

#### UTILS

    $wt.extend
    $wt.config
    $wt.merge
    $wt.iterate
    $wt.log
    $wt.job(...).task(...).execute(...)
    $wt.queue(...).push(...).execute(...)

#### EVENTS

    $wt.trigger -> $wt.fire?
    $wt.on
    $wt.off
    $wt.once

#### PROCESS

    $wt.process.shell
    $wt.process.fork
    $wt.process.child

#### DATABASE

    $wt.db.mysql
    $wt.db.mysql.install

#### SYSTEM

    $wt.glob
    $wt.next
    $wt.cleanFolder
    $wt.minify

#### ALIAS

    $wt.file -> FS
    $wt.request -> AXIOS

#### ROUTE

    $wt.route.static
    $wt.route.start
    $wt.route.page
    $wt.route.rest
    $wt.route.form
    $wt.route.file
    $wt.route.middelware.add
    $wt.route.middelware.list

#### TEMPLATE

    $wt.template
    $wt.template.add

#### STRING

    $wt.placeholder
    $wt.hash
    $wt.id
    $wt.formatBytes
