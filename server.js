'use strict';

// dependencies - core-public-internal
var log = require('./lib/log');
var auth = require('./lib/auth');
var replicate = require('./lib/replicate');
var rains = require('./lib/rains');
var pulse = require('./lib/pulse');

rains.setup();
auth.setup()
  .then(function() {
    log.info('Authentication Confirmed');

    // setup and start the replisction
    replicate.start()
      .then(function() {
        // TODO: move createDBs out of replicate, then replicate and pulse can start together, and independantly

        // start the pulse for local databases
        pulse.start();
      });

  })
  .catch(function(error) {
    log.error('rain error', error);
    throw new Error('Encountered an error');
  });
