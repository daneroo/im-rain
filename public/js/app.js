'use strict';

var socket = io.connect();
socket.on('message', logMessage);

function logMessage(message) {
  console.log(message);
  if (message.change) {
    var c = message.change;
    message = {
      stamp: c.doc.stamp,
      host: c.doc.host,
      db: message.dbname,
      rev: c.doc._rev
    };
  }
  var msgElt = document.getElementById("lastMessage");
  msgElt.innerHTML = JSON.stringify(message);
}
