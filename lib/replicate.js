'use strict';

// dependencies - core-public-internal
var nano = require('nano');
var bluebird = require('bluebird');
// var follow = require('follow');
var log = require('./log');
var config = require('./config');
var db = require('./db');

exports = module.exports = {
  createDBs: createDBs,
  replicatorRing: replicatorRing
};

var wellKnownRains = [{
  srv: 'http://admin:supersecret@cantor.imetrical.com:5984',
  db: 'rain-fire'
// },{
//   srv: 'https://daniel:couchone42@imetrical.iriscouch.com',
//   db: 'rain-cloud'
}];

function createDBs(rains) {
  return bluebird.resolve(rains)
    .each(db.create);
}



// Here is how we cancel with curl (on remote...)
// curl -s -X GET https://daniel:couchone42@imetrical.iriscouch.com/_active_tasks|json
// curl -s -X POST https://daniel:couchone42@imetrical.iriscouch.com/_replicate -d '{"replication_id":"4cf6eac9f8ce6d9dd8c4db39b240fbdb+continuous+create_target", "cancel":true}' -H "Content-Type: application/json"

function replicatorRing(rains) {
  // make a copy
  rains = rains.slice();

  // add iris
  rains.push(wellKnownRains[0]);

  // return bluebird.resolve(rains)
  //   .each(db.create);
  rains.forEach(function(r, i, ary) {
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

    log.info('replicate from %s to %s', desiredSource, desiredTarget);

    // use nano to replicate (_active_tasks)
    nano(config.couch.url).db.replicate(desiredSource, desiredTarget, {
      create_target: true,
      continuous: true
    }, function(err, resp, headers) {
      if (err) {
        log.error(err);
      } else {
        log.info('+repl:', src, desiredSource, '-->', desiredTarget);
      }
    });

  });
}
