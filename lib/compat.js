//var format = require('util').format;

/**
 * Weak version of util.format supports only %s placeholders.
 * Fixes Issue#3 compatibility with node < 5.4
 */
exports.format = function (fmt, args) {
  if (fmt.indexOf('%d') != -1 ||
      fmt.indexOf('%j') != -1) {
    throw "This format only supports %s placeholders";
  }
  if (typeof arguments[0] != 'string') {
    throw "First argument to format, must be a format string";
  }
  var i = 0;
  var params = arguments;
  return fmt.replace(/%s/g, function () {
    i++;
    if (params[i] === undefined) {
      throw "Number of arguments didn't match format placeholders.";
    }
    return params[i];
  });
}