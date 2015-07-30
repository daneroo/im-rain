'use strict';

// presents the same interface as socket.emit...
// used for broadcasting...

var log = require('./log');

var messageBus = null;

exports = module.exports = {
  setBus: function(iEmit) {
    messageBus = iEmit;
  },
  emit: function( /*...*/ ) {
    var argsArray = Array.prototype.slice.call(arguments);
    if (!messageBus) {
      // warn of undelivered message?
      log.warn('MessageBus::undelivered', argsArray);
      return;
    }
    // call messageBus.emit(same params as were passed in)
    messageBus.emit.apply(messageBus, argsArray);
  }
};
