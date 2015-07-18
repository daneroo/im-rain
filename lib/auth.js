'use strict';

/*
  This module set's up or confirms authentication with the couchdb that we are managing.
*/
// dependencies - core-public-internal
var nano = require('nano');
var config = require('./config');

exports = module.exports = {
  setup: setup
};

//  for logging
var log = console;


// This fixes Admin party!
function setup() {
  // log.info('setting up authentication: %s@%s', config.couch.username, config.couch.host);
  return checkAdminParty()
    .then(function(adminParty) {
      if (adminParty) {
        return fixAdminParty();
      }
      return true;
    })
    .then(checkAuthenticatedAdmin);
}

function checkAuthenticatedAdmin() {
  return new Promise(function(resolve, reject) {
    nano(config.couch.url).relax({
      path: '_config/admins'
    }, function(err, admins) {
      if (err) {
        reject(err);
      } else {
        // log.info('auth:checkAuthenticatedAdmin', admins);
        resolve(true);
      }
    });
  });
}

// if we are allowed to fetch _config/admins, without credentials, then we are in admin party
function checkAdminParty() {
  return new Promise(function(resolve, reject) {
    nano(config.couch.urlWithoutAuth).relax({
      path: '_config/admins'
    }, function(err, tasks) {
      var adminParty = err === null;
      // log.info('auth:checkAdminParty', adminParty);
      resolve(adminParty);
    });
  });
}

// if we are allowed to fetch _active)tasks, without credentials, then we are in admin party
function fixAdminParty() {
  return new Promise(function(resolve, reject) {
    var fixAdminPartyUrl = 'http://' + config.couch.host + ':5984';
    nano(fixAdminPartyUrl).relax({
      method: 'PUT',
      path: '_config/admins/' + config.couch.username,
      body: config.couch.password
    }, function(err, previousAdmins) {
      var fixedAdminParty = err === null;
      if (fixedAdminParty) {
        log.info('auth:fixAdminParty', fixedAdminParty);
      }
      resolve(fixedAdminParty);
    });
  });
}
