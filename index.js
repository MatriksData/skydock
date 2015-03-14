var DockerEvents = require('docker-events'),
    Docker = require('dockerode'),
    exec = require('child_process').exec,
    util = require('util'),
    config = require('./config');

var docker = config.dockerOpts ? new Docker(config.dockerOpts) : new Docker();

var domain = (function() {
    var d = '';
    config.domain.split('.').forEach(function(part) {
        d = part + '/' + d;
    });
    return '/skydns/' + d;
})();

console.log('Domain is ' + domain);

var emitter = new DockerEvents({
    docker: docker
});

var updateSkydns = function(id, isSet) {
    docker.getContainer(id)
        .inspect(function(err, data) {
            var name = /.*\/(.*)$/.exec(data.Name)[1],
                ip = data.NetworkSettings.IPAddress,
                cmd = util.format('etcdctl %s %s %s',
                                  isSet ? 'set' : 'rm',
                                 domain + name, ip);
            console.log('The command to be processed: ' + cmd);
            exec(cmd, function(err, stdout, stderr) {
                if (err) {
                    console.log(stderr);  // TODO check if it is necessary to tog full error
                }
            });
        });
}

emitter.on("start", function(message) {
    updateSkydns(message.id, true);
});

emitter.on("die", function(message) {
    updateSkydns(message.id, false);
});

emitter.start();
