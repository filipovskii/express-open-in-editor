var parseUrl = require('parseurl');
var querystring = require('querystring');
var path = require('path');
var configure = require('open-in-editor').configure;

module.exports = function(options) {
  options = options || {};

  var url = options.url || '/open-in-editor';
  var opener = configure(options, function(err) {
    console.warn('open-in-editor configure error: ', err);
  });

  if (!opener) {
    return function openInEditorFallback(req, res, next) {
      next();
    };
  }

  return function openInEditor(req, res, next) {
    function fail(code, message) {
      res.statusCode = code;
      res.end(message);
    }

    var parsedUrl = parseUrl(req);

    if (parsedUrl.pathname !== url) {
      next();
      return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = req.method === 'OPTIONS' ? 200 : 405;
      res.setHeader('Allow', 'GET, HEAD, OPTIONS');
      res.setHeader('Content-Length', '0');
      res.end();
      return;
    }

    var filename = querystring.parse(parsedUrl.query).file;

    if (!filename) {
      return fail(400, 'Parameter missed: file');
    }

    // temporary solution
    // should take in account options.base
    filename = path
      .resolve('/', filename)
      .replace(/^([a-z]+:)?\//i, '');

    opener.open(filename).then(
      function() {
        res.statusCode = 200;
        res.end('OK');
      },
      function(e) {
        fail(500, 'open-in-editor error: ' + e);
      }
    );
  };
};
