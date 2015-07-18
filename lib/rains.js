'use strict';

// dependencies - core-public-internal
var _ = require('underscore');
var log = require('./log');
var config = require('./config');

var rains;
exports = module.exports = rains = {
  setup: setup,
  local: [],
  wellKnown: [{
    srv: 'http://admin:supersecret@cantor.imetrical.com:5984',
    db: 'rain-fire'
      // },{
      //   srv: 'https://daniel:couchone42@imetrical.iriscouch.com',
      //   db: 'rain-cloud'
  }]
};

function setup() {
  log.info('Setting up rains');
  var numLocalDBCopies = 2;
  var counter = 0;

  _.times(numLocalDBCopies, function() {
    rains.local.push({
      srv: config.couch.url,
      db: 'rain-' + counter++
    });
  });
  log.info('rains',rains);
}