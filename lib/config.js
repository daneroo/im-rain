'use strict';

// dependencies - core-public-internal
var os = require('os');

var config;
exports = module.exports = config =  {
  // this is how I identify this host/process/container
  nodename: process.env.NODE_NAME || os.hostname(),
  // this is for the local couch instance
  couch: {
    host: process.env.COUCH_HOST || '192.168.99.100',
    username: 'imetrical',
    password: 'secret'
  }
};

// this shoud happen synchronously...
// Precalculated urls
// with or without credentials,
// should not change, so evaluate th IIFE only once.
config.couch.urlWithoutAuth = (function() {
  var c = exports.couch;
  return 'http://' + c.host + ':5984';
})();

config.couch.url = (function() {
  var c = exports.couch;
  return 'http://' + c.username + ':' + c.password + '@' + c.host + ':5984';
})();
