'use strict';

// Promise versions of basic operations

// dependencies - core-public-internal
var bluebird = require('bluebird');
var nano = require('nano');
// var bluebird = require('bluebird');
var log = require('./log');
var config = require('./config');
var rains = require('./rains');
var bus = require('./bus');

exports = module.exports = {
  createLocalDBs: createLocalDBs,
  activeTasks: activeTasks
};

function createLocalDBs() {
  return bluebird.resolve(rains.local)
    .each(create);
}

function create(rain) {
  return new Promise(function(resolve, reject) {
    nano(rain.srv).db.create(rain.db, function(error, result) {
      // if already exists, ok.
      if (error && error.error !== 'file_exists') {
        log.error(error);
        reject(new Error('Could not create database ' + rain.db));
      }
      resolve();
    });
  });
}

// default is local server
function activeTasks( /*server*/ ) {
  var server = config.couch.url;
  return new Promise(function(resolve, reject) {
    log.info('activeTasks', server);
    nano(server).relax({
      path: '_active_tasks'
    }, function(error, tasks) {
      if (error) {
        log.error(error);
        reject(new Error('Could not retreive active tasks'));
      }
      if (!tasks.length) {
        log.info('task: no tasks found');

      }
      tasks.forEach(function(task) {
        log.info('task:', task.progress, task.type, task.source, task.target, task.replication_id);
        bus.emit('message', task);
      });
      resolve(tasks);
    });
  });
}
