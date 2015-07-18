'use strict';

// dependencies - core-public-internal
var os = require('os');
var nano = require('nano');
var async = require('async');
var follow = require('follow');
var _ = require('lodash'); // only for fillIn:: _.extend
var config = require('./config');
var log = require('./log');
var rains = require('./rains');

exports = module.exports = {
  start: start,
  setBus:setBus
};

var messageBus = null;
function setBus(iEmit){
  messageBus = iEmit;
}
function broadcastChange(msg){
  if (messageBus){
    messageBus.emit('message',msg);
  }
}

function start() {
  rains.local.forEach(function(r, i, ary) {
    var pulse = new Pulse(r.srv, r.db).start();
    pulse.track(); // this works
    ary[i].pulse = pulse;
  });

}

function Pulse(srv, dbname) {
  this.srv = srv;
  this.dbname = dbname;
  this.conn = nano(srv);
  this.db = this.conn.use(dbname);
  //this.createAttempts=3;
  this.doc = {};
}
Pulse.prototype = {
  //var delay=Math.floor(Math.random()*10000);
  hostkey: function() {
    return ['heartbeat', config.nodename, this.dbname].join(':');
  },
  jitter: function(cb) {
    var delay = Math.floor(Math.random() * 1000);
    // console.log('aplying jitter %d',delay);
    setTimeout(function() {
      // console.log('done jitter %d',delay);
      cb(null, 'jitter:' + delay);
    }, delay);
  },

  // this will create the db and retry the call.
  createAndRetry: function(boundRetry, cb) {
    console.log('-create:' + this.dbname);
    this.conn.db.create(this.dbname, function(error, r, h) {
      if (error) {
        cb(error);
      } else { // attempt to save again
        boundRetry(cb);
      }
    });
    return;

  },
  fetch: function(cb) {
    var self = this;
    // console.log('fetch %s',this.hostkey());
    this.db.get(this.hostkey(), function(error, doc, headers) {
      if (error) {
        if (error.message === 'no_db_file') {
          self.createAndRetry(self.fetch.bind(self), cb);
          return;
        } else {
          // don"t cb(error) because we will insert instead of update
          // cb(error);
          self.doc = {};
        }
      } else {
        self.doc = doc;
      }
      // console.log('fetched',self.doc);
      cb(null, 'fetched:' + self.doc._rev || 'no-rev');
    });
  },
  fillIn: function(cb) {
    _.extend(this.doc, {
      stamp: new Date(),
      host: config.nodename,
      pid: process.pid
    });
    cb(null, 'filledIn:' + this.doc.stamp.toISOString());
  },
  save: function(cb) { // insert or update
    var self = this;
    var saveMethod = (this.doc._rev) ? 'update' : 'insert';
    //console.log('saveMethod',saveMethod);
    var onsave = function(error, body, headers) {
      if (error) {
        if (error.message === 'no_db_file') {
          self.createAndRetry(self.save.bind(self), cb);
        } else {
          cb(error);
        }
      } else {
        cb(null, [saveMethod, body.id || 'no-id', body.rev || 'no-rev'].join(':'));
      }
    };
    if (saveMethod === 'update') {
      this.db.insert(this.doc, onsave);
    } else {
      this.db.insert(this.doc, this.hostkey(), onsave);
    }

  },
  ping: function() {
    var self = this;
    async.series([
        this.jitter.bind(this),
        this.fetch.bind(this),
        this.fillIn.bind(this),
        this.save.bind(this)
      ],
      function(error, results) {
        if (error) {
          console.log('ping:error', error);
        } else {
          log.info(self.dbname + ':ping:results ' + results[results.length - 1]);
        }
      });
  },
  compact: function() {
    var self = this;
    this.conn.db.compact(this.dbname, '', function() {
      self.db.info(function(e, r, c) {
        //console.log('post-compact-info',r);
        console.log('post-compact-info', r.compact_running, r.disk_size, r.data_size || 'unknownn data_size');
      });
    });
  },
  track: function() {
    var self = this;
    follow({
      db: this.srv + '/' + this.dbname,
      include_docs: true
    }, function(error, change) {
      if (!error) {
        //console.log(dbname+"::change " + change.seq + " has " + Object.keys(change.doc).length + " fields");
        console.log(self.dbname + '::change ' + change.seq + ' id:' + change.doc._id || 'no-id');
        //console.log(dbname+'::change',change);
        broadcastChange({dbname:self.dbname,change:change});
      } else {
        console.log('follow::error', self.dbname, error);
      }
    });
  },
  start: function() {
    this.ping();
    setInterval(this.ping.bind(this), 5000);
    // setInterval(this.compact.bind(this), 60000);
    //setTimeout(this.track.bind(this),4000);
    return this;
  }
};
