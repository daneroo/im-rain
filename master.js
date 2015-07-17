'use strict';

// dependencies - core-public-internal
var _ = require('underscore');
_.mixin(require('underscore.string'));
var nano = require('nano');
var Pulse = require('./lib/pulse').Pulse;
var auth = require('./lib/auth');

//  for logging
var log = console;

var rains = []; //{srv,db}

log.info('rains', rains);
auth.setup()
  .then(function() {
    log.info('Authentication Confirmed');

    var counter = 0;

    _.times(2, function() {
      rains.push({
        srv: auth.couchUrl(),
        db: 'rain-' + counter++
      });
    });

    // start the pulse for local databases
    rains.forEach(function(r, i, ary) {
      var rain = new Pulse(r.srv, r.db).start();
      // rain.track(); // this works
      ary[i].rain = rain;
    });

    // for replication later
    // var servers = ["dirac.imetrical.com", "darwin.imetrical.com"];
    rains.push({
      srv: 'https://daniel:couchone42@imetrical.iriscouch.com',
      db: 'rain-cloud'
    });

  })
  .catch(function(err) {
    log.error('auth:setup error');
    throw new Error('Unable to setup authentication');
  });

function replicatorRing() {
  rains.forEach(function(r, i, ary) {
    var ip1 = (i + 1) % ary.length;
    var next = ary[ip1];
    var replsrv = r.srv;
    if (r.srv.match(/iriscouch/)) {
      console.log('iriscouch swap server, use:', next.srv);
      replsrv = next.srv;
    }

    var desiredSource = (replsrv === r.srv) ? r.db : r.srv + '/' + r.db;
    var desiredTarget = (replsrv === next.srv) ? next.db : next.srv + '/' + next.db;

    console.log('repl', desiredSource, desiredTarget);

    // use nano to replicate (_active_tasks)
    nano(replsrv).db.replicate(desiredSource, desiredTarget, {
      id: 'zabaza' + Math.random(),
      continuous: true
    }, function(err, resp, headers) {
      if (err) {
        console.log(err);
      } else {
        console.log('+repl:', replsrv, desiredSource, '-->', desiredTarget);
      }
    });

    console.log('All done replicating');
    // return;    // below uses replicator db.

    nano(replsrv).relax({
      path: '_active_tasks'
    }, function(err, tasks) {
      if (err) {
        console.log(err);
        return;
      }
      // console.log(tasks);
      tasks.forEach(function(task) {
        console.log('task:', task.type, task.source, task.target, task.replication_id);
      });
    });
  });
}

var replicator = true;
if (replicator) {
  replicatorRing();
  setInterval(replicatorRing, 30000);
}
