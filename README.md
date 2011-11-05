# im-rain Redundant array of inexpensive nodes

Trying to bring up a discovesrable peer network to pass around presence, state, and perhaps simple metrics history.

## references
*   [sodn](https://github.com/isaacs/sodn)
*   [hook.io](https://github.com/hookio/hook.io)
*   [haibu](https://github.com/nodejitsu/haibu)
*   [other vagrant project for haibu vm](https://github.com/Filirom1/haibu-vagrant)

## sodn (by isaacs)

## Hook.io
Hook.io looks like a really good starting point. We need to extend the hook-cloud acros machines. perhaps the couch transport (with possible replicas) is enough.


List of hoooks:

*   webhook: Starts up a webserver which takes all incoming HTTP requests and emits the request headers and body to your hook.io cloud

## haibu
Haibu which is an important infrastructure piece for nodejitsu, sits on hook.io.

I used this [other vagrant project for haibu vm](https://github.com/Filirom1/haibu-vagrant)
as a start for my [vagrant-nodeapps](https://github.com/daneroo/vagrant-nodeapps) server setup, but I will pass on haibu for now.

## HOWTO
install the modules locally:

    npm install 
    