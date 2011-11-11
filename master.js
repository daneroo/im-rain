var _  = require('underscore');
_.mixin(require('underscore.string'));
var os = require('os');
var cradle = require('cradle');
var follow = require('follow');
var dbopts = {
  host:'127.0.0.1',
  port:5984,
  auth:{
    username:'daniel',
    password:'xxxxxx'
  }
};
var conn = new (cradle.Connection)(dbopts);

function Monitor(dbname){
  this.dbname = dbname;
  this.db = conn.database(dbname);
}
Monitor.prototype = {
  ping: function (){
    var self=this;
    var hostkey='heartbeat:'+os.hostname()+':'+self.dbname;
    self.db.save(hostkey, {
      stamp: new Date(),
      host: os.hostname(),
      pid: process.pid
    }, function (err, res) {
      if (err) {
        console.log('error',err)
      } else {
        console.log('pingd:'+self.dbname+':'+res);
      }
    });  
  },
  createAndPing: function(){
    var self=this;
    this.db.exists(function (err, exists) {
      if (err) {
        console.log('error', err);
      } else if (!exists) {
        console.log('creating database');
        self.db.create();
      }
      //self.ping();
      setInterval(function(){self.ping()},10000);
    });
  }
};

/* 
*/
new Monitor('rain-0').createAndPing();
new Monitor('rain-1').createAndPing();

console.log({
  'config':conn.config(),
  'databases':conn.databases()
});

function track(dbname){
  follow({db:"http://daniel:xxxxxx@127.0.0.1:5984/"+dbname, include_docs:true}, function(error, change) {
    if(!error) {
      console.log(dbname+"::change " + change.seq + " has " + Object.keys(change.doc).length + " fields");
      console.log(dbname+'::change',change);
    } else {
      console.log('follow::error',dbname,error);
    }
  });
}

track('rain-0');
track('rain-1');
