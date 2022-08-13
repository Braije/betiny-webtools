# Memo
Some ideas to investigate.

    app.get('/**:type(html)' ...
    localtunnel: https://www.pluralsight.com/guides/exposing-your-local-node-js-app-to-the-world

# Architecture

- Clustering ensure by PM2.
- Auto load and configure each services.
- Security: middleware to describe each service:
- Database: MYSQL with pool clustering request, elasticsearch, couchDB ...
- Templating: Custom templating service and events

# Goal

The main goal is to expose any service quickly without
take into account all architecture, security issue
and having a database API already implemented.
We have a module approach to let a team working together.

# Install

## Remark

Your local environment should contains "europa.eu"
otherwise ECAS login will not work

    http(s)://localhost.europa.eu

Manage your own certificat

    openssl req -nodes -new -x509 -keyout server.key -out server.cert

For the rest simply clone the repository

    git clone https://github.com/Braije/betiny.git .

After that, as usual, install node modules.

    npm install

Rename .env-sample to .env and fill values with your own

    .env (rename, edit and fill it)

Initiate your install app. Some of them need
to install a database etc..

    // Run all (xxx/yyy/install).
    node server install

    // Run only one (xxx/nuts/install)
    node server install:nuts

    // OR ...
    yarn dev install
    yarn dev install:nuts

To run the application

    // Default
    node server

    // Dev mode
    // server restart automatically afer
    // each changes.
    node run dev

    // Or with yarn
    yarn dev

    // On prod use PM2
    // https://github.com/Unitech/pm2
    yarn prod

Run any test

    // Default
    node server test

    //


## Documentation
TODO

