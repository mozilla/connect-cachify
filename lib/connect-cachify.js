var format = require('util').format,
    und = require('underscore');

var opts;

exports.setup = function (options) {
  opts = options;
  if (options.production === undefined) {
    opts['production'] = true;
  } else {
    opts['production'] = options['production'];
  }

  console.log(opts);
  if (! options.js) options.js = {};
  if (! options.css) options.css = {};

  return function (req, resp, next) {
    resp.local('cachify_js', cachify_js);
    resp.local('cachify_css', cachify_css);
    next();
  };
};

var prod_or_dev_tags = function (filename, family, link_fmt) {
  if (opts['production'] !== true &&
      opts[family] &&
      opts[family][filename]) {
        return und.map(opts[family][filename], function (f) {
          return format(link_fmt, f);
        }).join('\n');
  }
  return format(link_fmt, filename);
};

exports.cachify_js = cachify_js = function (filename) {
  return prod_or_dev_tags(filename, 'js',
                          '<script src="%s"></script>');
};

exports.cachify_css = cachify_css = function (filename) {
  return prod_or_dev_tags(filename, 'css',
                          '<link href="%s" rel="stylesheet" type="text/css">');
};
