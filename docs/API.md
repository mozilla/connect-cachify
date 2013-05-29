# connect-cachify API #

The [README](../README.md) for this project has a good tutorial on using
``connect-cachify``. This documents the API and goes deep on all the options.

## setup(assets, [options]) ##

Creates the cachify middleware and allows you to customizes how you'll use
it in your Node.js app.

``assets`` is a dictionary where the keys are your production urls,
and the value is a list of development urls that produce the same asset.
See the example below for format.

``options`` is an optional dictionary with the following optional values:

* ``debug`` - Boolean indicating we should always re-write urls with a hash. (**Default: false**)
* ``prefix`` - String to prepend to the hash in links. (**Default: none**)
* ``production`` - Boolean indicating if your in development or production mode.
   Effects how links for js and css files are generated. (**Defaults to ``true``**)
* ``root`` - A fully qualified path which is a root where static
   resources are served up. This is the same value you'd send to the
   static middleware. (**Default: ``'.'``**)
* ``url_to_paths`` - an associative array of URLs to absolute filename paths.
  Useful to specify paths to files that are not in the ``root`` directory.
   (**Default: ``{}``**)

### Example use of ``setup`` ###

    var assets = {
      '/js/main.min.js': ['/js/jquery.js', '/js/widget.js', '/js/main.js'],
      '/js/dashboard.js': ['/js/jquery.js', '/js/dashboard.js'],
      '/css/main.min.css': ['/css/reset.css', '/main.css'] };
    app.use(cachify.setup(assets, { root: __dirname }));

### Using url_to_paths and root in ``setup`` ###

``url_to_paths`` is an associative array that specifies the absolute path of an asset. This is useful for files that are not located under the root directory. In the following example, both jquery.js and reset.css are located outside of the root directory and would not normally be found by connect-cachify.

    var assets = {
      '/js/main.min.js': ['/js/jquery.js', '/js/widget.js', '/js/main.js'],
      '/js/dashboard.js': ['/js/jquery.js', '/js/dashboard.js'],
      '/css/main.min.css': ['/css/reset.css', '/main.css'] };

    // specify paths outside of the root directory to find files.
    var url_to_paths = {
      '/js/jquery.js': '/home/development/jquery/jquery.js',
      '/css/reset.css': '/home/development/css-reset/reset.css'
    };

    app.use(cachify.setup(assets, {
      root: __dirname,
      url_to_paths: url_to_paths
    }));

Both ``root`` and ``url_to_paths`` are optional, though it is safe to use them together.

## Middleware Helper Functions ##

The ``setup`` middleware will expose several **helpers** to your views:

* cachify_js
* cachify_css
* cachify

Using the optional ``prefix`` will slightly improve middleware performance
when attempting to detect if a request is safe to re-write it's request url.

## cachify_js(production_js_url, [options]) ##
Helper function for generating ``script`` tags for your Javascript files.

``production_js_url`` is a url to your minified, production ready Javascript.

``options`` is an optional dictionary with the following optional value:

* ``hash`` - MD5 hash to use instead of calculating from disk (**Default: none**)
* ``defer`` - if true, adds the defer attribute to scripts in production mode. (**Default: false**)
* ``async`` - if true, adds the async attribute to scripts in production mode. (**Default: false**)

In production mode, a single script tag is generated, with a cache-busting
url. In development mode (``production: false``), Multiple script tags are
generated, one per dependent file from the ``assets`` argument to the ``setup`` function.

### Example EJS template: ###

      </p>
      <%- cachify_js('/js/main.min.js') %>
    </body>
    </html>

## cachify_css(production_css_url, [options]) ##
Helper function for generating ``link`` tags for your CSS files.

``production_css_url`` is a url to your minified, production ready CSS.

``options`` is an optional dictionary with the following optional value:

* ``hash`` - MD5 hash to use instead of calculating from disk (**Default: none**)

In production mode, a single link tag is generated, with a cache-busting
url. In development mode (``production: false``), Multiple link tags are
generated, one per dependent file from the ``assets`` argument to the ``setup`` function.

### Example EJS template: ###

      </p>
      <%- cachify_css('/css/main.min.css') %>
    </body>
    </html>

## cachify(production_url, [options]) ##
Lower level Helper function for generating HTML tags for your urls.

``production_url`` is a url to your minified, production asset.

``options`` is an optional dictionary with the following optional values:

* ``hash`` - MD5 hash to use instead of calculating from disk (**Default: none**)
* ``tag_format`` - String with one '%s' placeholder, which will be replaced each time with your production_url or development urls.

In production mode, a single HTML tag is generated, with a cache-busting
url. In development mode (``production: false``), Multiple tags are
generated, one per dependent file from the ``assets`` argument to the ``setup`` function.

### Example EJS template: ###

      </p>
      <%- cachify('/js/login.min.js', {
            tag_format: '<script src="%s" defer></script>'}) %>
    </body>
    </html>

