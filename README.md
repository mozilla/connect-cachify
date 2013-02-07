[![build status](https://secure.travis-ci.org/mozilla/connect-cachify.png)](http://travis-ci.org/mozilla/connect-cachify)
# Cachify #
``connect-cachify`` makes having proper browser cache and HTTP caching
behavior for assets easier.

It is a set of middleware and view helper functions for the Node.js express framework.

This does not provide in-memory caching, middleware caching, or many other
types of caching. Cashify is focused on reducing the number of HTTP requests
to your web nodes.

## Installation ##

    npm install connect-cachify

## How to Use ##
Instructions below are for Express 2, but Express 3 is also supported.

    var app,
        express = require('express'),
        cachify = require('connect-cachify'),

    app = express.createServer();

## Middleware ##
    var assets = {
        "/js/main.min.js": [
          '/js/lib/jquery.js',
          '/js/magick.js',
          '/js/laughter.js'
        ],
        "/css/home.min.css": [
          '/css/reset.css',
          '/css/home.css'
        ],
        "/css/dashboard.min.css": [
          '/css/reset.css',
          '/css/common.css'
          '/css/dashboard.css'
        ]
    };

    var url_to_paths = {
      '/js/jquery.js': '/home/development/jquery/jquery.js',
      '/css/reset.css': '/home/development/css-reset/reset.css'
    };

    app.use(cachify.setup(assets, {
      root: __dirname,
      url_to_paths: url_to_paths,
      production: your_config['use_minified_assets']
    }));

``setup`` takes two parameters: assets and options. Assets is an associative
array where the keys are your production urls, and the value is a list of
development urls that produce the same asset.

We'll discussion options in a section below.

Cachify middleware is now enabled. Let's look at this after hooking up the view
helpers.

Note: You **must** put ``cachify.setup`` before static or other connect
middleware which works with these same requests.

## In an EJS template

    ...
    <head>
      <title>Dashboard: Hamsters of North America</title>
      <%- cachify_css('/css/dashboard.min.css') %>
    </head>
    <body>
    ...
      <%- cachify_js('/js/main.min.js') %>
    </body>
    ...

## In a Jade template

    ...
    title= Dashboard: Hamsters of North America
    meta(charset='utf-8')
    | !{cachify_css('/css/dashboard.min.css')}
    ...
    body
    ...
      | !{cachify_js('/js/main.min.js')}
      block scripts

In production mode, a call to ``cachify_js`` will produce a single script tag
like:

    <script src="/js/fa6d51a13a245a90aeb48eeca0e52396/main.min.js"></script>

When production was set to false, ``cachify_js`` will produce:

    <script src="/js/lib/jquery.js"></script>
    <script src="/js/magick.js"></script>
    <script src="/js/laughter.js"></script>

The middleware makes caching transparent. A request for
``/fa6d51a13a245a90aeb48eeca0e52396/js/main.min.js`` will have the req.url
rewritten to ``/js/main.min.js``, so that other middleware will work properly.

The middleware sets the cache expiration headers to the Mayan Apocalypse, and
does it's best to ensure browsers won't request that version of
``/js/main.min.js`` again.

A goal is for this module to work well with other connect compilers, such as
[LESS](http://lesscss.org/) or
[connect-assets](https://github.com/TrevorBurnham/connect-assets).

## Options ##
The following are optional config for ``cachify.setup``

* root - Path where static assets are stored on disk. Same value as you'd pass
to the ``static`` middleware.

* url_to_paths - an associative array of URLs to absolute filename paths.
  Useful to specify paths to files that are not in the ``root`` directory.

* production - Boolean indicating if your in development or production mode.
    Effects how links for js and css files are generated.

* debug - Boolean indicating we should always re-write urls with a hash.

For full details, see the [API documentation](docs/API.md).

## Magick ##
So how does cachify work?

When you cachify a url, it adds an MD5 hash of the file's contents into the URL
it generates:

    http://example.com/cbcb1e865e61c08a68a4e0bfa293e806/stylo.css

Incoming requests are checked for this MD5 hash. If present and if we' know
about the resource (either via options or the file exists on disk), then the
request path is rewritten back to ``/stylo.css``, so that another route can
process the request.

These requests are served up with expires headers that are very long lived, so a user's browser will only request them once.

Cachify **doesn't** attempt to **find an older version** of your resource,
if the MD5 has was for an older file.

## Status ##

This module is brand spanking new. Please file
[issues](https://github.com/mozilla/connect-cachify/issues) with ideas, bugs,
etc.

It was created as part of the [BrowserID](https://github.com/mozilla/browserid)
project.

## Debugging ##
To debug cachify's hashed url behavior, pass in the following parameter in
your options block:

    setup({ debug: true, ...});

Now even in development mode, cache busting URLs will be generated, so you
can troubleshoot any problems cachify magick is causing you.

## Development ##

Patches are welcome! To run unit tests...

    nodeunit test

## Wordpress Cachify ##
Does this all sound like gobbledygook? Maybe you're looking for [Wordpress cachify plugin](http://wordpress.org/extend/plugins/cachify/) instead of ``connect-cachify``.
