'use strict';

// Promise versions of basic operations

// dependencies - core-public-internal
var nano = require('nano');
// var bluebird = require('bluebird');
var log = require('./log');

exports = module.exports = {
  create: create,
  activeTasks: activeTasks
};


function create(rain) {
  return new Promise(function(resolve, reject) {
    // log.info('create db', rain);
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

function activeTasks(rain) {
  return new Promise(function(resolve, reject) {
    // log.info('create db', rain);
    nano(rain.srv).relax({
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
        log.info('task:', task.progress,task.type, task.source, task.target, task.replication_id);
      });
      resolve(tasks);
    });
  });
}

