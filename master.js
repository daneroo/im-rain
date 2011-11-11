var _  = require('underscore');
_.mixin(require('underscore.string'));
var os = require('os');
var nano = require('nano');
var follow = require('follow');

var authdburl = "http://daniel:pokpok@127.0.0.1:5984";
var conn = nano(authdburl);

function Monitor(dbname){
  this.dbname = dbname;
  this.db = conn.use(dbname);
  this.createAttempts=3;
}
Monitor.prototype = {
  ping: function (){
    var self=this;
    var hostkey='heartbeat:'+os.hostname()+':'+self.dbname;
    self.db.get(hostkey,function(e,doc,h){
      if (e){
        console.log('err:get',e);
        var doc = {
          stamp: new Date(),
          host: os.hostname(),
          pid: process.pid
        };
        self.db.insert(doc,hostkey, function (error, body, headers) {
          if (error) {
            console.log('error',error)
            if(error.message === 'no_db_file' && self.createAttempts>0) {
              self.createAttempts--;
              console.log('create:'+self.dbname+':'+self.createAttempts);
              // create database and retry
              return conn.db.create(self.dbname, function () {
                self.ping();
              });
            }
          } else {
            console.log('insert pingd:'+self.dbname+':'+body);
          }
        });  
      } else {
        //console.log('got',doc);
        doc.stamp=new Date();
        doc.host= os.hostname();
        doc.pid= process.pid;        
        self.db.insert(doc,hostkey, function (error, body, headers) {
          if (error) {
            console.log('error',error)
          } else {
            console.log('update pingd:'+self.dbname+':',body.id||'no-id',body.rev||'no-rev');
          }
        });
      }      
    });
    return;
    
  },
  start: function(){
    var self=this;
    self.ping();
    setInterval(function(){self.ping()},10000);
  }
};

/* 
*/
new Monitor('rain-0').start();
new Monitor('rain-1').start();


function track(dbname){
  follow({db:"http://daniel:pokpok@127.0.0.1:5984/"+dbname, include_docs:true}, function(error, change) {
    if(!error) {
      //console.log(dbname+"::change " + change.seq + " has " + Object.keys(change.doc).length + " fields");
      console.log(dbname+"::change " + change.seq + " id:" + change.doc._id||'no-id');
      //console.log(dbname+'::change',change);
    } else {
      console.log('follow::error',dbname,error);
    }
  });
}

track('rain-0');
track('rain-1');
var continuous=true;
conn.db.replicate('rain-0','rain-1',continuous,function(e,r,h){
  if (e){
    console.log('repl:err',e);
  } else {
    console.log('repl:r,h',r,h);
  }
});
conn.db.replicate('rain-1','rain-0',continuous,function(e,r,h){
  if (e){
    console.log('repl:err',e);
  } else {
    console.log('repl:r,h',r,h);
  }
});