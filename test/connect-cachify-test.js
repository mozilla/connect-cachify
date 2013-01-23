var cachify  = require('../lib/connect-cachify'),
    fs       = require('fs'),
    nodeunit = require('nodeunit'),
    step     = require('step');

// reset cachify's internal state to default
// settings...
var resetConfig = function () {
  cachify.setup({
    production: true,
    root: '.',
    debug: false
  });
};

var make_assets = function () { return {
  "/js/main.min.js": [
    "/js/lib/jquery.js",
    "/js/lib/jquery-foomatic.js",
    "/js/main.js",
    "/js/font-loader.js#with_fragment_id"
  ]}; };

exports.setup = nodeunit.testCase({
  setUp: function (cb) {
    resetConfig();
    step(
      fs.mkdir('/tmp/js', this),
      function (err) {
        fs.mkdir('/tmp/js/lib', this);
      },
      function (err) {
        fs.writeFile('/tmp/js/main.min.js', "", "utf8", this);
      },
      function (err) {
        fs.writeFile('/tmp/js/lib/jquery.js', "", "utf8", this);
      },
      function (err) {
        fs.writeFile('/tmp/js/lib/jquery-foomatic.js', "", "utf8", this);
      },
      function (err) {
        fs.writeFile('/tmp/js/main.js', "", "utf8", this);
      },
      function (err) {
        fs.writeFile('/tmp/js/font-loader.js', "", "utf8", this);
      },
      function (err) {
        cb();
      }
    );
  },
  tearDown: function (cb) {
    step(
      fs.unlink('/tmp/js/main.js', this),
      function (err) {
        fs.unlink('/tmp/js/main.min.js', this);
      },
      function (err) {
        fs.unlink('/tmp/js/lib/jquery.js', this);
      },
      function (err) {
        fs.unlink('/tmp/js/lib/jquery-foomatic.js', this);
      },
      function (err) {
        fs.unlink('/tmp/js/font-loader.js', this);
      },
      function (err) {
        fs.rmdir('/tmp/js/lib', this);
      },
      function (err) {
        fs.rmdir('/tmp/js', this);
      },
      function (err) { cb(); }
    );
  },
  "No Config, no problem": function (test) {
    test.doesNotThrow(function () {
      cachify.setup();
    });
    test.done();
  },
  "Development mode with debug": function (test) {
    var assets = make_assets(),
        files,
        links,
        mddlwr;

    mddlwr = cachify.setup(assets, {
                             root: '/tmp',
                             production: false,
                             debug: true});

    links = cachify.cachify_js("/js/main.min.js").split('\n');
    test.equal(links[0], '<script src="/d41d8cd98f/js/lib/jquery.js"></script>',
              "debug option puts hash in all urls");
    files = cachify.cachify("/js/main.min.js", {tag_format: '<script src="%s" defer></script>'}).split('\n');
    test.equal(files[0], '<script src="/d41d8cd98f/js/lib/jquery.js" defer></script>');
    test.done();
  },
  "Development mode": function (test) {
    var assets = make_assets(),
        req = {
          url: '/d41d8cd98f/js/main.min.js'
        },
        resp = {
          state: {},
          local: function (key, value) {
            this.state[key] = value;
          },
          setHeader: function (key, value) {
            this.state[key] = value;
            if (!this.state['header']) this.state['header'] = 0;
            this.state['header'] += 1;
          },
          on: function (name, cb) {

          }
        },
        mddlwr;
    mddlwr = cachify.setup(assets, {
                      root: '/tmp',
                      production: false
    });
    var links = cachify.cachify_js("/js/main.min.js").split('\n');
    test.equal(links.length, assets["/js/main.min.js"].length,
              "All script tags created");
    test.equal(links[0], '<script src="/js/lib/jquery.js"></script>',
              "No hashes in all urls during development");
    test.equal(links[3], '<script src="/js/font-loader.js#with_fragment_id"></script>',
              "Fragment identifier in URL is preserved");
    test.equal(cachify.uncached_resources.indexOf("/js/font-loader.js#with_fragment_id"), -1,
              "Fragment identifiers are never sent to server, search on disk for resource by removing fragment id");
    var files = cachify.cachify("/js/main.min.js").split('\n');
    test.equal(files.length, assets["/js/main.min.js"].length,
              "All urls created");
    test.equal(files[0], '/js/lib/jquery.js',
              "No hashes in all urls during development");
    mddlwr(req, resp, function () {
      test.ok(resp.state.cachify_js);
      test.ok(resp.state.cachify_css);
      test.ok(resp.state.header > 0);
      test.done();
    });
  },
  "Production mode": function (test) {
    var assets = make_assets(),
        req = {
          url: '/d41d8cd98f/js/main.min.js'
        },
        resp = {
          state: {},
          local: function (key, value) {
            this.state[key] = value;
          },
          setHeader: function (key, value) {
            this.state[key] = value;
            if (!this.state['header']) this.state['header'] = 0;
            this.state['header'] += 1;
          },
          on: function (name, cb) {

          }
        },
        mddlwr;
    mddlwr = cachify.setup(
        assets, {
          root: '/tmp'
    });
    var link = cachify.cachify_js("/js/main.min.js");
    test.equal(link, '<script src="/d41d8cd98f/js/main.min.js"></script>',
              "Hashes in all urls in production");
    var file = cachify.cachify("/js/main.min.js");
    test.equal(file, "/d41d8cd98f/js/main.min.js");
    mddlwr(req, resp, function () {
      test.ok(resp.state.cachify_js);
      test.ok(resp.state.cachify_css);
      test.ok(resp.state.cachify);
      test.ok(resp.state.header > 0);
      test.equal(req.url, '/js/main.min.js');
      test.done();
    });
  },
  "Production mode with absolute URL in prefix": function (test) {
    var assets = make_assets(),
        req = {
          url: '/v/d41d8cd98f/js/main.min.js'
        },
        resp = {
          state: {},
          local: function (key, value) {
            this.state[key] = value;
          },
          setHeader: function (key, value) {
            this.state[key] = value;
            if (!this.state['header']) this.state['header'] = 0;
            this.state['header'] += 1;
          },
          on: function (name, cb) {

          }
        },
        mddlwr;
    mddlwr = cachify.setup(
      assets, {
        root: '/tmp',
        prefix: 'http://example.com/v/'
      });
    var link = cachify.cachify_js("/js/main.min.js");
    test.equal(link, '<script src="http://example.com/v/d41d8cd98f/js/main.min.js"></script>',
              "Hashes in all urls in production");
    var file = cachify.cachify("/js/main.min.js");
    test.equal(file, "http://example.com/v/d41d8cd98f/js/main.min.js");
    mddlwr(req, resp, function () {
      test.ok(resp.state.cachify_js);
      test.ok(resp.state.cachify_css);
      test.ok(resp.state.cachify);
      test.ok(resp.state.header > 0);
      test.equal(req.url, '/js/main.min.js');
      test.done();
    });
  },
  "Custom prefix works with non-file assets": function (test) {
    var assets = make_assets(),
        req = {
          url: '/cachify/d41d8cd98f/other'
        },
        resp = {
          state: {},
          local: function (key, value) {
            this.state[key] = value;
          },
          setHeader: function (key, value) {
            this.state[key] = value;
            if (!this.state['header']) this.state['header'] = 0;
            this.state['header'] += 1;
          },
          on: function (name, cb) {

          }
        },
        mddlwr;
    mddlwr = cachify.setup(
        assets, {
          prefix: 'cachify',
          root: '/tmp'
        });
    var link = cachify.cachify_js("/other", {hash: 'd41d8cd98f'});
    test.equal(link, '<script src="/cachify/d41d8cd98f/other"></script>');

    mddlwr(req, resp, function () {
      test.ok(resp.state.cachify_js);
      test.ok(resp.state.cachify_css);
      test.ok(resp.state.cachify);
      test.ok(resp.state.header > 0);
      test.equal(req.url, '/other');
      test.done();
    });
  }
});
