# im-rain Redundant array of inexpensive nodes

Trying to bring up a discovesrable peer network to pass around presence, state, and perhaps simple metrics history.

## references
*   [sodn](https://github.com/isaacs/sodn)
*   [hook.io](https://github.com/hookio/hook.io)
*   [haibu](https://github.com/nodejitsu/haibu)
*   [other vagrant project for haibu vm](https://github.com/Filirom1/haibu-vagrant)
*   [replicate](https://github.com/mikeal/replicate.git)
*   [follow](https://github.com/iriscouch/follow.git)
*   [springy](https://github.com/dhotson/springy.git)
*   [arborjs](http://arborjs.org/)

## HOWTO
install the modules locally:

    npm install 
    node master.js
    NANO_ENV=testing node master.js

### couchapp
Note: once installed with pip (`sudo pip install couchapp`), 
the files live here:`/Library/Python/2.6/site-packages/couchapp` on my mac

    couchapp generate rain
    cd rain
    #couchapp push . http://localhost:5984/rain-0
    couchapp push . http://daniel:password@localhost:5984/rain-0
    couchapp autopush . http://daniel:password@localhost:5984/rain-0

    couchapp generate view watched-nodes
    
    
## sodn (by isaacs)

## Hook.io
Hook.io looks like a really good starting point. We need to extend the hook-cloud acros machines. perhaps the couch transport (with possible replicas) is enough.


List of hooks:

*   webhook: Starts up a webserver which takes all incoming HTTP requests and emits the request headers and body to your hook.io cloud

## haibu
Haibu which is an important infrastructure piece for nodejitsu, sits on hook.io.

I used this [other vagrant project for haibu vm](https://github.com/Filirom1/haibu-vagrant)
as a start for my [vagrant-nodeapps](https://github.com/daneroo/vagrant-nodeapps) server setup, but I will pass on haibu for now.

## replicating with `_replicator` db

    curl -H 'Content-Type: application/json' -X POST http://daniel:password@localhost:5984/_replicate -d ' {"source": "rain-1", "target": "rain-0", "create_target": true, "continuous": true} '
    
