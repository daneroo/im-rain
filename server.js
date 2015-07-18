'use strict';

// dependencies - core-public-internal
var _ = require('underscore');
_.mixin(require('underscore.string'));
var Pulse = require('./lib/pulse').Pulse;
var log = require('./lib/log');
var config = require('./lib/config');
var auth = require('./lib/auth');
var replicate = require('./lib/replicate');
var db = require('./lib/db');

var rains = []; //{srv,db}

log.info('rains', rains);
auth.setup()
  .then(function() {
    log.info('Authentication Confirmed');

    var counter = 0;

    _.times(2, function() {
      rains.push({
        srv: config.couch.url,
        db: 'rain-' + counter++
      });
    });

    var replicator = true;
    if (replicator) {
      one();
      setInterval(one, 30000);
    }

    var heartbeat = true;
    if (heartbeat) {
      rains.forEach(function(r, i, ary) {
        var rain = new Pulse(r.srv, r.db).start();
        rain.track(); // this works
        ary[i].rain = rain;
      });
    }
    // start the pulse for local databases
  })
  .catch(function(err) {
    log.error('auth:setup error');
    throw new Error('Unable to setup authentication');
  });

function one() {
  return replicate.createDBs(rains)
    .then(function() {
      return db.activeTasks(rains[0]);
    })
    .then(function() {
      replicate.replicatorRing(rains);
    })
    .then(function() {
      return db.activeTasks(rains[0]);
    })
    .catch(function(error) {
      log.error(error);
      // pretty fatal..
    });
}
