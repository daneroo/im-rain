var _  = require('underscore');
_.mixin(require('underscore.string'));
var cradle = require('cradle');

var cradle = require('cradle');
var db = new(cradle.Connection)().database('rain');

db.create();

db.save('heartbeat', {
  stamp: new Date(),
  host: require('os').hostname()
}, function (err, res) {
  if (err) {
    // Handle error
    console.log('error',err)
  } else {
    // Handle success
    console.log('saveok',res);
  }
});

db.get('heartbeat', function (err, doc) {
  if (err) {
    // Handle error
    console.log('error',err)
  } else {
    // Handle success
    console.log('getok',doc)
  }
});
