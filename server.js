'use strict';

// dependencies - core-public-internal
var _ = require('underscore');
_.mixin(require('underscore.string'));
var log = require('./lib/log');
var auth = require('./lib/auth');
var replicate = require('./lib/replicate');
var db = require('./lib/db');
var rains = require('./lib/rains');
var pulse = require('./lib/pulse');

rains.setup();

auth.setup()
  .then(function() {
    log.info('Authentication Confirmed');

    var replicator = true;
    if (replicator) {
      one();
      setInterval(one, 30000);
    }

    var heartbeat = true;
    if (heartbeat) {
      pulse.start();
    }
    // start the pulse for local databases
  })
  .catch(function(err) {
    log.error('auth:setup error');
    throw new Error('Unable to setup authentication');
  });

function one() {
  return replicate.createDBs(rains.local)
    .then(function() {
      return db.activeTasks(rains.local[0]);
    })
    .then(function() {
      replicate.replicatorRing(rains.local);
    })
    .then(function() {
      return db.activeTasks(rains.local[0]);
    })
    .catch(function(error) {
      log.error(error);
      // pretty fatal..
    });
}
