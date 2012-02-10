# Cachify #
``connect-cachify`` makes having proper browser cache and HTTP caching behavior for assets easier.

It is a set of middlware, helpers, etc for Node.js express framework.

This does not provide in-memory caching, middleware caching, or many other types of caching. Cashify is focused on reducing the number of HTTP requests to your web nodes.

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

It's encouraged to reuse the ``js`` and ``css`` config with other connect compilers, such as less or connect-assets.

## Helpers

    app.helpers(cachify.helpers);

## In an EJS template

    ...
    <head>
      <title>Dashboard: Hamsters of North America</title>
      <%- cachify_css('dashboard.min.css') %>
    </head>
    <body>
    ...
      <%- cachify_js('/js/main.min.js') %>
    </body>
    ...

In production mode, a call to ``cachify_js`` will produce a single script tag like

    <script src="/js/fa6d51a13a245a90aeb48eeca0e52396/main.min.js"></script>

When production was set to false, ``cachify_js`` will produce:

    <script src="/js/lib/jquery.js"></script>
    <script src="/js/magick.js"></script>
    <script src="/js/laughter.js"></script>

## Options ##
The following are optional config for ``cachify.setup``

* url_prefix - A url prefix to append to links generated in ``cachify_js`` and ``cachify_css``. **Example:** "http://cdn.example.com/media/"

Using ``url_prefix``, one could support dark launches, since all assets are revisioned with hashes and the CDN network would service your request.

## Magick ##
So how does cachify work?

When you cachify a url, it adds an md5 hash of the file's contents into the URL it generates.

    http://example.com/cbcb1e865e61c08a68a4e0bfa293e806/stylo.css

Incoming requests are checked for this md5 hash. If present and if we' know about the resource
(either via options or the file exists on disk), then the request path is rewritten back to
``/stylo.css``, so that another route can process the request.

These requests are served up with expires headers that are very long lived, so a user's browser will only request them once.

## Debugging ##
To debug cachify's behavior in production, pass in the following parameter in your options block:

    setup({ debug: true, ...});

Now even in development mode, cache busting URLs will be generated, so you can troubleshoot any problems cachify magick is causing you.

## Wordpress Cachify ##
Does this all sound like gobbledeegook? Maybe your looking for [Wordpress cachify plugin](http://wordpress.org/extend/plugins/cachify/) instead of ``connect-cachify``.

## Questions ##

* Should we always put hash in urls, even in development mode? Maybe that is a config flag, so we can do that while writing cachify?
* If you edit a file, cachify won't notice... turn off in dev or add file stat check?
* Using a deployment SHA is good for JS and CSS, but not good for images, etc...
* Etags... useful for API, page views, no so much on static assets?

* express compiler
** Less and CSS image sha, etc?