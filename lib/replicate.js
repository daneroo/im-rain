'use strict';

// dependencies - core-public-internal
var nano = require('nano');
// var follow = require('follow');
var log = require('./log');
var config = require('./config');
var db = require('./db');
var rains = require('./rains');
var bus = require('./bus');

exports = module.exports = {
  start: start
};

function start() {
  setInterval(round, 30000);
  return round();
}

function round() {
  return db.createLocalDBs()
    .then(db.activeTasks)
    .then(replicatorRing)
    .then(db.activeTasks)
    .catch(function(error) {
      log.error('Replication round:', error);
      // pretty fatal..
    });
}

// Here is how we cancel with curl (on remote...)
// curl -s -X GET https://daniel:couchone42@imetrical.iriscouch.com/_active_tasks|json
// curl -s -X POST https://daniel:couchone42@imetrical.iriscouch.com/_replicate -d '{"replication_id":"4cf6eac9f8ce6d9dd8c4db39b240fbdb+continuous+create_target", "cancel":true}' -H "Content-Type: application/json"

function replicatorRing() {
  var allRains = rains.local.slice();
  allRains.push(rains.wellKnown[0]);

  // return bluebird.resolve(rains)
  //   .each(db.create);
  allRains.forEach(function(r, i, ary) {
    var ip1 = (i + 1) % ary.length;
    var next = ary[ip1];
    var src = r.srv;

    // each of these have either src or dst with .srv===aconfig.couch.url
    if (src === config.couch.url) {
      log.info('src is local: PUSH replication');
    } else {
      log.info('src is remote: PULL replication');
      // var c=a, a=b, b=c;
    }

    //  can we use  config.couchUrl as prefix for local?
    function canonical(r) {
      return (r.srv === config.couch.url) ? r.db : r.srv + '/' + r.db;
    }
    var desiredSource = canonical(r);
    var desiredTarget = canonical(next);

    log.info('-repl:', src, desiredSource, '-->', desiredTarget);

    // use nano to replicate (_active_tasks)
    nano(config.couch.url).db.replicate(desiredSource, desiredTarget, {
      create_target: true,
      continuous: true
    }, function(err, resp, headers) {
      if (err) {
        log.error(err);
      } else {
        log.info('+repl:', src, desiredSource, '-->', desiredTarget);
        bus.emit('message', {
          source: desiredSource,
          target: desiredTarget
        });
      }
    });

  });
}
