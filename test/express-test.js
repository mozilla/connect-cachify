/* Test Express 2.x to maintain compatability                                 */

var cachify = require('../lib/connect-cachify'),
    express2,
    express3,
    express4,
    http = require('http'),
    nodeunit = require('nodeunit'),
    os = require('os'),
    path = require('path'),
    shell = require('shelljs'),
    spawn = require('child_process').spawn;

var tmpDir = os.tmpDir ? os.tmpDir() : '/tmp';

var express2dir = path.join(tmpDir, 'connect-cachify-express2-test');
var express3dir = path.join(tmpDir, 'connect-cachify-express3-test');
var express4dir = path.join(tmpDir, 'connect-cachify-express4-test');

const EXPRESS_2_VER = '2.5.10';
const EXPRESS_3_VER = '3.0.0rc5';
const EXPRESS_4_VER = '4.0.0';

exports.setup = nodeunit.testCase({
    setUp: function(cb) {
        [{
            dir: express2dir,
            ver: EXPRESS_2_VER
        }, {
            dir: express3dir,
            ver: EXPRESS_3_VER
        }, {
            dir: express4dir,
            ver: EXPRESS_4_VER
        }].forEach(function(express, i) {
            console.log('Creating ' + express.dir);
            shell.mkdir('-p', express.dir);
            process.chdir(express.dir);

            var npm = spawn('npm', ['install', 'express@' + express.ver], {});
            var debug = function(data) {
                process.stdout.write(data.toString('utf8'));
            };
            npm.stdout.on('data', debug);
            npm.stderr.on('data', debug);
            npm.on('exit', function(code) {
                if (0 !== code) {
                    throw new Error('Unable to npm install express');
                }
                if (0 === i) {
                    express2 = require(path.join(express2dir, 'node_modules/express'));
                } else if (1 === i) {
                    express3 = require(path.join(express3dir, 'node_modules/express'));
                } else {
                    express4 = require(path.join(express4dir, 'node_modules/express'));
                    cb();
                }
            });
        });
    },
    tearDown: function(cb) {
        [express2dir, express3dir, express3dir].forEach(function(expressDir) {
            console.log('Removing ' + expressDir);
            shell.rm('-rf', expressDir);
        });
        cb();
    },
    "Run Server": function(test) {
        test.equal(express2.version, EXPRESS_2_VER);
        test.equal(express3.version, EXPRESS_3_VER);
        // Express 4 doesn't have a version so check for a property instead
        test.ok( !! express4.Router);
        [express2, express3, express4].forEach(function(express, i) {
            var app = i === 0 ? express.createServer() : express();
            app.use(cachify.setup([]));
            app.use(function(req, res, next) {
                var locals = typeof res.locals === 'function' ? res.locals() : res.locals;
                test.ok( !! locals.cachify);
                test.ok( !! locals.cachify_css);
                test.ok( !! locals.cachify_js);
                test.ok( !! locals.cachify_prefetch);
                res.send('ok');
            });
            var server = app.listen(0);
            var port = server.address().port;
            console.log('Started web server on port ' + port);
            var resText = "";
            var req = http.request({
                port: port,
                path: '/baddecafe1/foo.js'
            }, function(res) {
                test.equal(res.statusCode, 200);
                res.on('data', function(chunk) {
                    resText += chunk;
                });
                res.on('end', function() {
                    test.equal(resText, 'ok');
                    app.close ? app.close() : server.close();
                    if (1 === i) test.done();
                });
            });
            req.end();
        });
    }
});