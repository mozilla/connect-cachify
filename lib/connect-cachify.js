/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var crypto = require('crypto'),
    format = require('./compat').format,
    fs = require('fs'),
    path = require('path'),
    und = require('underscore');

var opts,
    _assets,
    _cache = {};

/**
 * The setup function customizes how you'll use cachify in your Node.js app.
 *
 * It takes two arguments, assets and options.
 *
 * Assets is an associative array where the keys are your production urls,
 * and the value is a list of development urls that produce the same asset.
 *
 *
 * There are several options:
 * production - Boolean indiciating if your in development or production mode.
 *    Effects how links for js and css files are generated.
 *
 * root - A fully qualifid path which is a root where static
 *    resources are served up. This is the same value you'd send to the
 *    static middlware.
 *
 *
 * debug - Boolean indicating we should always re-write urls with a hash.
 */
exports.setup = function (assets, options) {
  _assets = assets;
  if (!options) options = {};
  opts = options;
  if (options.production === undefined) {
    opts.production = true;
  }
  if (!options.root) opts.root = '.';
  if (options.debug === undefined) {
    opts.debug = false;
  }

  return function (req, resp, next) {
    resp.local('cachify_js', cachify_js);
    resp.local('cachify_css', cachify_css);
    // If the first path element is a md5 hash AND
    // Either the filename is a key in our opts[family]
    // or the file exists on the filesystem
    var m = req.url.match(/^\/[a-f0-9]{32}/);
    if (m && m.index == 0) {
      var true_path = req.url.slice(33); // 32 character md5 + 1 for slash
      var exists = false;
      //['css', 'js'].forEach(function (family) {
      if (assets[true_path]) exists = true;
      //});
      if (exists === false) {
        if (_cache[true_path]) {
          if (_cache[true_path].exists === true) {
            exists = true;
          }
        } else {
          // Would we ever want to use cachify for non-file resources?
          if (path.existsSync(path.join(opts.root, true_path))) {
            exists = true;
            _cache[true_path] = {exists: true};
          } else {
            // Hmm potential DOS Attack here... maybe we shouldn't cache
            // checking disk every time isn't that bad - just like static
            // middleware
            console.warn('Cachify like URL, but no file found');
            _cache[true_path] = {exists: false};
          }
        }
      }
      if (exists === true) {
        resp.setHeader('Cache-Control', 'public, max-age=31536000');
        req.url = true_path;
      }
    }
    next();
  };
};

/**
 * If filename is an absolute path (starts with a '/') The hash
 * will be pre-pended with be slashified.
 * Examples:
 * /foo.js                   -> /a998d8e98f/foo.js
 * foo.js                    -> a998d8e98f/foo.js
 * http://example.com/foo.js -> http://example.com/foo.js
 */
var hashify = function (filename) {
  if (typeof filename !== 'string')
    throw "cachify ERROR, expected string for filename, got " + filename;
  if (filename.indexOf('://') != -1) {
    return filename;
  }
  if (opts['production'] !== true &&
      opts['debug'] === false) {
    return filename;
  }
  var hash;
  if (_cache[filename] && _cache[filename].hash) {
    hash = _cache[filename].hash;
    console.info('cache hit ', filename);
  } else {
    console.info('cache miss ', filename);
    var md5 = crypto.createHash('md5');
    try {
      var data = fs.readFileSync(path.join(opts.root, filename));
      md5.update(data);
      // Expensive, maintain in-memory cache
      if (! _cache[filename]) _cache[filename] = {exists: true};
      hash = _cache[filename].hash = md5.digest('hex');
    } catch (e) {
      // Not intersting to cache, programmer error?
      console.error('Cachify bailing on hash... no such file ' + filename );
      console.error(e);
      return filename;
    }
  }

  if (filename[0] === '/') {
    return format('/%s%s', hash, filename);
  } else {
    return format('%s/%s', hash, filename);
  }
};

var prod_or_dev_tags = function (filename, link_fmt) {
  if (opts['production'] !== true &&
      _assets[filename]) {
        return und.map(_assets[filename], function (f) {
          return format(link_fmt, hashify(f));
        }).join('\n');
  }
  return format(link_fmt, hashify(filename));
};

exports.cachify_js = cachify_js = function (filename) {
  return prod_or_dev_tags(filename,
                          '<script src="%s"></script>');
};

exports.cachify_css = cachify_css = function (filename) {
  return prod_or_dev_tags(filename,
                          '<link href="%s" rel="stylesheet" type="text/css">');
};
