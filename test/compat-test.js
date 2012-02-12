var compat   = require('../lib/compat'),
    format   = compat.format,
    nodeunit = require('nodeunit');

exports.format = nodeunit.testCase({
  "typical format": function (test) {
    test.equal(format("/%s%s", "foo", "/bar"), "/foo/bar");
    test.equal(format("%s/%s", "foo", "bar"), "foo/bar");
    test.equal(format("%s", "foo"), "foo");
    test.equal(format("ID#%s", 32432), "ID#32432");
    test.equal(format("foo"), "foo");
    test.done();
  },
  "programmer error": function (test) {
    test.throws(function () {
      format(1, "foo", "/bar");
    });
    test.throws(function () {
      format("%d/%d", 1, 2);
    });
    test.throws(function () {
      format("%s/%s");
    });
    test.done();
  }
});