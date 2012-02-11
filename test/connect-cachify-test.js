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
    "/js/lib/jquery.js", "/js/lib/jquery-foomatic.js",
    "/js/main.js"
  ]}; };

exports.setup = nodeunit.testCase({
  setUp: function (cb) {
    resetConfig();
    console.log('setUp');
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
        console.log('finished setting up'); cb();
      }
    );
  },
  tearDown: function (cb) {
    console.log('tearDown');
    step(
      fs.unlink('/tmp/js/main.js', this),
      function (err) {
        fs.unlink('/tmp/js/lib/jquery-foomatic.js', this);
      },
      function (err) {
        fs.unlink('/tmp/js/lib/jquery.js', this);
      },
      function (err) {
        fs.unlink('/tmp/js/main.min.js', this);
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
        mddlwr,
        links;
    mddlwr = cachify.setup(assets, {
                             root: '/tmp',
                             production: false,
                             debug: true});
    links = cachify.cachify_js("/js/main.min.js").split('\n');
    test.equal(links[0], '<script src="/d41d8cd98f00b204e9800998ecf8427e/js/lib/jquery.js"></script>',
              "debug option puts hash in all urls");
    test.done();
  },
  "Development mode": function (test) {
    var assets = make_assets(),
        req = {
          url: '/d41d8cd98f00b204e9800998ecf8427e/js/main.min.js'
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
          }
        },
        mddlwr;
    mddlwr = cachify.setup(assets, {
                      root: '/tmp',
                      production: false
    });
    var links = cachify.cachify_js("/js/main.min.js").split('\n');
    console.log('links', links.length);
    test.ok(links.length, "Multiple script tags");
    test.equal(links[0], '<script src="/js/lib/jquery.js"></script>',
              "No hashes in all urls during development");
    mddlwr(req, resp, function () {
      console.log(resp.state);
      test.ok(resp.state.cachify_js);
      test.ok(resp.state.cachify_css);
      test.ok(resp.state.header > 0);
      test.done();
    });
  },
  "Production mode": function (test) {
    var assets = make_assets(),
        req = {
          url: '/d41d8cd98f00b204e9800998ecf8427e/js/main.min.js'
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
          }
        },
        mddlwr;
    mddlwr = cachify.setup(
        assets, {
          root: '/tmp'
    });
    var links = cachify.cachify_js("/js/main.min.js");
    test.equal(links, '<script src="/d41d8cd98f00b204e9800998ecf8427e/js/main.min.js"></script>',
              "Hashes in all urls in production");
    mddlwr(req, resp, function () {
      console.log(resp.state);
      test.ok(resp.state.cachify_js);
      test.ok(resp.state.cachify_css);
      test.ok(resp.state.header > 0);
      test.done();
    });
  }
});