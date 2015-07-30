'use strict';

// dependencies - core-public-internal
var path = require('path');
var express = require('express');

var log = require('./lib/log');
var auth = require('./lib/auth');
var replicate = require('./lib/replicate');
var rains = require('./lib/rains');
var bus = require('./lib/bus');
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

// now the web server
(function startWebServer() {
  // var nr = require('newrelic');
  var app = express();
  var server = require('http').createServer(app);
  var io = require('socket.io')(server);

  // inject the bus (io)
  bus.setBus(io);

  var port = process.env.PORT || 8000;
  server.listen(port, function() {
    console.log('Express server listening on port *:' + port);
  });

  app.use(express.static(path.join(__dirname, 'public')));
  // app.get('/', function(req, res) {
  //   res.sendFile(__dirname + '/index.html');
  // });

  io.on('connection', function(socket) {
    io.emit('message', {
      will: 'be received by everyone whan anyone connects'
    });
  });

})();
