var _  = require('underscore');
_.mixin(require('underscore.string'));
var os = require('os');
var nano = require('nano');
var async = require('async');
var follow = require('follow');

var creds="daniel:pokpok@"
var rains = [];
var counter=0;
["dirac.imetrical.com","darwin.imetrical.com"].forEach(function(host,i){
//["dirac.imetrical.com"].forEach(function(host,i){
  _.times(2,function(){
    rains.push({srv:'http://'+creds+host+':5984',db:'rain-'+counter++});
  });
});
rains.push({srv:'https://daniel:password@imetrical.iriscouch.com',db:'rain-cloud'});

console.log('rains',rains);


function Monitor(srv,dbname){
  this.srv = srv;
  this.dbname = dbname;
  this.conn = nano(srv);
  this.db = this.conn.use(dbname);
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
      this.conn.db.create(this.dbname,function(error,r,h){
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
        console.log(iso8601(new Date())+' '+self.dbname+':ping:results',results[results.length-1]);
      }
    });
  },
  compact: function(){
    var self=this;
    this.conn.db.compact(this.dbname,'',function () {
      self.db.info(function(e,r,c){
        //console.log('post-compact-info',r);
        console.log('post-compact-info',r.compact_running,r.disk_size,r.data_size||'unknownn data_size');
      });
    });
  },
  track:function(){
    var self=this;
    follow({db:this.srv+'/'+this.dbname, include_docs:true}, function(error, change) {
      if(!error) {
        //console.log(dbname+"::change " + change.seq + " has " + Object.keys(change.doc).length + " fields");
        console.log(self.dbname+"::change " + change.seq + " id:" + change.doc._id||'no-id');
        //console.log(dbname+'::change',change);
      } else {
        console.log('follow::error',self.dbname,error);
      }
    });
  },
  start: function(){
    var self=this;
    //self.ping();
    setInterval(this.ping.bind(this), 5000);
    setInterval(this.compact.bind(this), 60000);
    //setTimeout(this.track.bind(this),4000);
    return this;
  }
};

rains.forEach(function(r,i,ary){
  var rain=new Monitor(r.srv,r.db).start();
  ary[i].rain=rain;
});

function replicatorRing(){  
  var continuous=true;
  rains.forEach(function(r,i,ary){
    var ip1=(i+1)%ary.length;
    var next=ary[ip1];
    var replsrv = r.srv;
    if (r.srv.match(/iriscouch/)){
      console.log('iriscouch swap server, use:',next.srv);
      replsrv = next.srv;
    }
    
    var desiredSource=(replsrv===r.srv)?r.db:r.srv+'/'+r.db;
    var desiredTarget=(replsrv===next.srv)?next.db:next.srv+'/'+next.db;

    //use nano to replicate (_active_tasks)
    nano(replsrv).db.replicate(desiredSource,desiredTarget,true,function(e,r,h){
      if(e){console.log(e)} else {
        console.log('+repl:',replsrv,desiredSource,'-->',desiredTarget);
        console.log(r);
      }
    });

    return;    // below uses replicator db.
    var found=false;
    var repldb = nano(replsrv).use('_replicator');
    repldb.list({include_docs:true},function(e,docs,h){
      console.log('+repl:',replsrv,desiredSource,'-->',desiredTarget);
      if (e) {
        console.log(e);
      } else {
        //console.log(r.srv,JSON.stringify(docs,null,2));
        docs.rows.forEach(function(entry,j){
          if (entry.id.match(/^_design/)) return;
          var doc = entry.doc;
          if (doc.source===desiredSource && doc.target===desiredTarget) {
            console.log('repl:Found:',doc);
            found=true;
          }
        });
        if (!found) {
          var newrepl={
            source:desiredSource,
            target:desiredTarget,
            //create_target:true
            continuous:true,
            user_ctx: {
              name: "daniel"
            }
          };
          repldb.insert(newrepl,function(ei,ri,hi){
            if (ei){ console.log(ei);}
            else console.log('repl:Added:',newrepl);
          });
        }
      }
    })
  });
}

var replicator=true;
if (replicator){
  setInterval(replicatorRing, 30000);
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