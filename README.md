# Cachify #
The ``connect-cachify`` makes is super easy to have fantastic frontend caching behavior.

It is a set of middlware, helpers, etc for Node.js express framework.

## Installation ##

    npm install connect-cachify

## How to Use ##

    var app,
        express = require('express'),
        cachify = require('connect-cachify'),

    app = express.createServer();

## Middleware ##

    app.use(cachify.setup({
      production: your_config['use_minified_assets'],
      js: {
        "/js/main.min.js": [
          '/js/lib/jquery.js',
          '/js/magick.js',
          '/js/laughter.js'
        ]
      },
      css: {
        "home.min.css": [
          '/css/reset.css',
          '/css/home.css'
        ],
        "dashboard.min.css": [
          '/css/reset.css',
          '/css/common.css'
          '/css/dashboard.css'
        ]
      }      
    }));

A request for ``/js/fa6d51a13a245a90aeb48eeca0e52396/main.min.js`` would have the req.path rewritten to /js/main.min.js, so that other middleware will work properly.

Note: You **must** put ``cachify.setup`` before static or other connect middleware which works with these same requests.

## Helpers

    app.helpers(cachify.helpers);

## In an EJS template

    ...
    <head>
      <title>Dashboard: Hamsters of North America</title>
      <%- csslinks('dashboard.min.css') %>
    </head>
    <body>
    ...
      <%- jslinks('/js/main.min.js') %>
    </body>
    ...

In production mode, a call to jslinks will produce a single script tag like

    <script src="/js/fa6d51a13a245a90aeb48eeca0e52396/main.min.js"></script>

When production was set to false, jslinks will produce:

    <script src="/js/lib/jquery.js"></script>
    <script src="/js/magick.js"></script>
    <script src="/js/laughter.js"></script>

## Options ##
The following are optional config for ``cachify.setup``

* url_prefix - A url prefix to append to links generated in ``jslinks`` and ``csslinks``. **Example:** "http://cdn.example.com/media/"

Using ``url_prefix``, one could support dark launches, since all assets are revisioned with hashes and the CDN network would service your request.

## Questions ##

* Should we always put hash in urls, even in development mode? Maybe that is a config flag, so we can do that while writing cachify?