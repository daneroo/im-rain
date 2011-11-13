var _  = require('underscore');
_.mixin(require('underscore.string'));
var os = require('os');
var nano = require('nano');
var async = require('async');
var follow = require('follow');

//var authdburl = "http://daniel:pokpok@127.0.0.1:5984";
//var authdburl = "http://daniel:pokpok@dirac.imetrical.com:5984";
var authdburl = "http://daniel:pokpok@darwin.imetrical.com:5984";

var conn = nano(authdburl);

function Monitor(dbname){
  this.dbname = dbname;
  this.db = conn.use(dbname);
  //this.createAttempts=3;
  this.doc={};
}
Monitor.prototype = {
  //var delay=Math.floor(Math.random()*10000);
  hostkey:function(){
    //return ['heartbeat',os.hostname(),process.pid,this.dbname].join(':');
    return ['heartbeat',os.hostname(),this.dbname].join(':');
  },
  jitter: function(cb){
    var delay=Math.floor(Math.random()*1000);    
    setTimeout(function(){cb(null,'jitter:'+delay)},delay);
  },
  
  // this will create the db and retry the call.
  createAndRetry: function(boundRetry,cb){
      console.log('-create:'+this.dbname);    
      conn.db.create(this.dbname,function(error,r,h){
        if (error){
          cb(error);
        } else { // attempt to save again
          boundRetry(cb);
        }
      });
      return;
    
  },
  fetch: function(cb){
    var self=this;
    this.db.get(this.hostkey(),function(error,doc,headers){
      if (error){
        if(error.message === 'no_db_file') {
          self.createAndRetry(self.fetch.bind(self),cb);
          return;
        } else {
          // don"t cb(error) because we will insert instead of update
          // cb(error);
          self.doc={};
        }
      } else {
        self.doc=doc;
      }
      cb(null,'fetched:'+self.doc._rev||'no-rev');
    });
  },
  fillIn: function(cb){
    _.extend(this.doc,{
      stamp: new Date(),
      host: os.hostname(),
      pid: process.pid
    });
    cb(null,'filledIn:'+iso8601(this.doc.stamp));
  },
  save: function(cb){ // insert or update
    var self=this;
    var saveMethod=(this.doc._rev)?'update':'insert';
    //console.log('saveMethod',saveMethod);
    var onsave = function (error, body, headers) {
      if (error) {
        if(error.message === 'no_db_file') {
          self.createAndRetry(self.save.bind(self),cb);
        } else {
          cb(error);
        }
      } else {
        cb(null,[saveMethod,body.id||'no-id',body.rev||'no-rev'].join(':'));
      }
    };
    if (saveMethod==='update') {
      this.db.insert(this.doc,onsave);
    } else {
      this.db.insert(this.doc,this.hostkey(), onsave);
    }
    
  },
  ping: function (){
    var self=this;
    async.series([
      this.jitter.bind(this),
      this.fetch.bind(this),
      this.fillIn.bind(this),
      this.save.bind(this)
    ],
    function(error,results){
      if (error){
        console.log('ping:error',error);
      } else {
        //console.log(iso8601(new Date())+' '+self.dbname+':ping:results',results);
        console.log(iso8601(new Date())+' '+self.dbname+':ping:results',results[3]);
      }
    });
  },
  compact: function(){
    var self=this;
    conn.db.compact(this.dbname,'',function () {
      self.db.info(function(e,r,c){
        //console.log('post-compact-info',r);
        console.log('post-compact-info',r.compact_running,r.disk_size,r.data_size||'unknownn data_size');
      });
    });
  },
  start: function(){
    var self=this;
    self.ping();
    setInterval(this.ping.bind(this), 3000);
    setInterval(this.compact.bind(this), 30000);
  }
};

new Monitor('rain-0').start();
new Monitor('rain-1').start();


function track(dbname){
  follow({db:authdburl+'/'+dbname, include_docs:true}, function(error, change) {
    if(!error) {
      //console.log(dbname+"::change " + change.seq + " has " + Object.keys(change.doc).length + " fields");
      console.log(dbname+"::change " + change.seq + " id:" + change.doc._id||'no-id');
      //console.log(dbname+'::change',change);
    } else {
      console.log('follow::error',dbname,error);
    }
  });
}

if (1){
  track('rain-0');
  track('rain-1');
}


var replicate=true;
if (replicate){
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
}

function stamplog(msg){
    console.log(iso8601(new Date())+' '+msg);
}
function iso8601(d){
    function pad(n){return n<10 ? '0'+n : n}
    return d.getUTCFullYear()+'-'
    + pad(d.getUTCMonth()+1)+'-'
    + pad(d.getUTCDate())+'T'
    + pad(d.getUTCHours())+':'
    + pad(d.getUTCMinutes())+':'
    + pad(d.getUTCSeconds())+'Z';
}