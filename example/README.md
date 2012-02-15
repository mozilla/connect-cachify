## Overview

A simple application that demonstrates cachify.

 * `run.js` - the express app that runs the show
 * `prod/` - where "production" minified resources are kept
 * `js/` or `css/` - where "development" sources are kept
 * `index.ejs` - a page that uses all the resources

## Running it

    $ ./run.js

now look at `http://127.0.0.1:3000` in your browser, notice 
only one resource for css and one for js is served with a 
url containing a has based on file contents.  Have a look at
the HTTP headers too.

    $ DEV=true ./run.js

now look at `http://127.0.0.1:3000` in your browser, notice 
the development resources are individually served.
