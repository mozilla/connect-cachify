/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*jslint node: true, nomen: true, white: true*/
"use strict";

var crypto = require('crypto'),
    format = require('./compat').format,
    fs = require('fs'),
    path = require('path'),
    und = require('underscore');

var existsSync = fs.existsSync || path.existsSync,
    opts,
    _assets,
    _cache = {};

exports.setup = function (assets, options) {
  _assets = assets;
  if (!options) options = {};
  opts = options;
  if (options.production === undefined) {
    opts.production = true;
  }
  if (!options.root) opts.root = '.';
  if (!options.url_to_paths) opts.url_to_paths = {};
  if (!options.prefix) {
    opts.prefix = '';
  // Must end with a '/'
  } else if (options.prefix.slice(-1) !== '/') {
    opts.prefix += '/';
  }
  // Don't lead with a '/'
  if (opts.prefix.charAt(0) === '/') {
    opts.prefix = opts.prefix.slice(1);
  }
  if (options.control_headers === undefined) {
    opts.control_headers = false;
  }
  if (options.debug === undefined) {
    opts.debug = false;
  }

  return function (req, resp, next) {
    // If the first path element is a md5 hash AND one of the following:
    // * the path is opts.prefix
    // * the filename is a key in our opts[family]
    // * or the file exists on the filesystem
    var prefix = escape_regex(no_url(opts.prefix)),
        fmt = format('^\\/%s[a-f0-9]{10}', prefix),
        m = req.url.match(new RegExp(fmt)),
        true_path, exists;

    if (typeof resp.local === 'function') {
      resp.local('cachify_prefetch', cachify_prefetch);
      resp.local('cachify_js', cachify_js);
      resp.local('cachify_css', cachify_css);
      resp.local('cachify', cachify);
    }
    else if (typeof resp.locals === 'function') {
      resp.locals({
        cachify_prefetch: cachify_prefetch,
        cachify_js: cachify_js,
        cachify_css: cachify_css,
        cachify: cachify
      });
    }
    if (m && m.index === 0) {
      // extract the hash
      var hash = req.url.slice(prefix.length + 1, prefix.length + 11);
      // 10 first characters of md5 + 1 for slash
      var url = req.url.slice(prefix.length + 11);
      var true_path = opts.url_to_paths[url] || path.join(opts.root, url);

      exists = false;

      if (opts.prefix !== '' &&
          req.url.indexOf('/' + opts.prefix) === 0) {
        exists = true;
      } else if (assets[true_path]) {
        exists = true;
      }

      if (exists === false) {
        if (_cache[true_path]) {
          if (_cache[true_path].exists === true) {
            exists = true;
          }
        } else {
          // Would we ever want to use cachify for non-file resources?
          if (existsSync(true_path)) {
            exists = true;
            _cache[true_path] = {exists: true};
          } else {
            // Hmm potential DOS Attack here... maybe we shouldn't cache
            // checking disk every time isn't that bad - just like static
            // middleware
            // Or use an LRU?
            console.warn('Cachify like URL, but no file found');
            _cache[true_path] = {exists: false};
          }
        }
      }

      // determine actual current hash of the file, it's worth the disk
      // read to ensure we never serve bogus resources and poison caches
      // issue #31
      fs.readFile(true_path, function(err, contents) {
        // ignore error
        var md5 = crypto.createHash('md5');
        if (contents) md5.update(contents);
        var actualHash = md5.digest('hex').slice(0, 10);

        if (exists === true && hash === actualHash) {
          resp.setHeader('Cache-Control', 'public, max-age=31536000');
          req.url = url;
          if (opts.control_headers === true) {
            resp.on('header', function () {
              // Relax other middleware... I got this one
              ['ETag', 'Last-Modified'].forEach(function (header) {
                if (resp.getHeader(header)) resp.removeHeader(header);
                if (resp.getHeader(header)) resp.removeHeader(header);
              });
            });
          }
        }
        next();
      });
    } else {
      next();
    }
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
var hashify = function (resource, hash) {
  if (typeof resource !== 'string')
    throw "cachify ERROR, expected string for resource, got " + resource;
  if (resource.indexOf('://') !== -1) {
    return resource;
  }

  if (! hash && opts.global_hash) {
    hash = opts.global_hash;
  }

  if (opts.production !== true &&
      opts.debug === false) {
    return resource;
  }

  // fragment identifiers on URLs are never sent to the server and they
  // should not exist on the filename. When looking up the resource on
  // disk, do so without the fragment identifier.
  var url = resource.replace(/#.*$/, '');
  var filename = opts.url_to_paths[url] || path.join(opts.root, url);

  if (hash) {
    // No-op, specifing a hash skips all this craziness
  } else if (_cache[filename] && _cache[filename].hash) {
    hash = _cache[filename].hash;
    //console.info('cache hit ', filename);
  } else {
    //console.info('cache miss ', filename);
    var md5 = crypto.createHash('md5');
    try {
      var data = fs.readFileSync(filename);
      md5.update(data);
      // Expensive, maintain in-memory cache
      if (! _cache[filename]) _cache[filename] = {exists: true};
      hash = _cache[filename].hash = md5.digest('hex').slice(0, 10);
    } catch (e) {
      // Not intersting to cache, programmer error?
      exports.uncached_resources.push(resource);
      console.error('Cachify bailing on hash... no such file ' + filename );
      console.error(e);
      return resource;
    }
  }
  if (opts.prefix.indexOf('://') === -1 &&
      resource[0] === '/') {
    return format('/%s%s%s', opts.prefix, hash, resource);
  } else {
    return format('%s%s%s%s', opts.prefix, hash, resource[0] === '/' ? '' : '/', resource);
  }
};

var prod_or_dev_tags = function (filename, link_fmt, hash) {
  if (opts.production !== true &&
      _assets[filename]) {
        return und.map(_assets[filename], function (f) {
          return format(link_fmt, hashify(f, hash));
        }).join('\n');
  }
  return format(link_fmt, hashify(filename, hash));
};

var cachify_js = exports.cachify_js = function (filename, options) {
  if (! options) options = {};
  var link_fmt = '<script src="%s"'

  /**
   * indicate to a browser that the script is meant to be executed after the
   * document has been parsed.
   */
  if (options.defer && opts.production === true) {
    link_fmt += ' defer';
  }

  /**
   * indicate that the browser should, if possible, execute the script
   * asynchronously
   */
  if (options.async && opts.production === true) {
    link_fmt += ' async';
  }

  link_fmt += '></script>';
  return prod_or_dev_tags(filename, link_fmt, options.hash);
};

var cachify_css = exports.cachify_css = function (filename, options) {
  if (! options) options = {};
  return prod_or_dev_tags(filename,
                          '<link href="%s" rel="stylesheet" type="text/css">',
                          options.hash);
};

var cachify_prefetch = exports.cachify_prefetch = function (filename, options) {
  if (! options) options = {};
  return prod_or_dev_tags(filename,
                          '<link rel="prefetch" href="%s">',
                          options.hash);
};

var cachify = exports.cachify = function (filename, options) {
  var tag_format;
  if (! options) options = {};
  if (options.tag_format)
      tag_format = options.tag_format;
  else
      tag_format = '%s';
  return prod_or_dev_tags(filename, tag_format, options.hash);
};

var no_url = function (prefix) {
  if (prefix.indexOf('://') === -1) return prefix;
  var m = prefix.match(/^[a-z]{3,5}:\/\/[a-z0-9\-_.]*(?:\:[0-9]*)?\/(.*)$/i);
  if (m) return m[1];
  else return prefix;
};

var escape_regex = function (str) {
  return str.replace('/', '\/');
};

exports.uncached_resources = [];
