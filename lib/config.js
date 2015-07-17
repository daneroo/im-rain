'use strict';

// dependencies - core-public-internal
var os = require('os');

exports = module.exports = {
  // this is how I identify this host/process/container
  nodename: process.env.NODE_NAME || os.hostname(),
  // this is for the local couch instance
  couch: {
    host: process.env.COUCH_HOST || '192.168.99.100',
    username:'imetrical',
    password:'secret'
  }
};
