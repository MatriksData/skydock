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

(function () {
    console.log('Update etcd for running docker container');

    docker.listContainers(function (err, containers) {
        containers.forEach(function (containerInfo) {
            docker.getContainer(containerInfo.Id).inspect(function(err, data) {
                var name = /.*\/(.*)$/.exec(data.Name)[1],
                    ip = data.NetworkSettings.IPAddress,
                    ipString = ip ? util.format('\'{"host":"%s"}\'', ip) : '',
                    cmd = util.format('etcdctl %s %s %s',
                        'set',
                        domain + name,
                        ipString);

                console.log('The command to be processed: ' + cmd);
                exec(cmd, function(err, stdout, stderr) {
                    if (err) {
                        console.log(stderr);  // TODO check if it is necessary to tog full error
                    }
                });
            });
        });
    })
}());

var emitter = new DockerEvents({
    docker: docker
});

var updateSkydns = function(id, isSet) {
    try{
        docker.getContainer(id)
            .inspect(function(err, data) {
                console.log(id);
                if(err){
                    console.log(err);
                }else{
                    var name = /.*\/(.*)$/.exec(data.Name)[1],
                        ip = data.NetworkSettings.IPAddress,
                        ipString = ip ? util.format('\'{"host":"%s"}\'', ip) : '',
                        cmd = util.format('etcdctl %s %s %s',
                            isSet ? 'set' : 'rm',
                            domain + name,
                            ipString);
                    if (isSet && ! ip) {
                        console.log('No IP is set to %s. Key adding will be cancelled.', name);
                        return;
                    }
                    console.log('The command to be processed: ' + cmd);
                    exec(cmd, function(err, stdout, stderr) {
                        if (err) {
                            console.log(stderr);  // TODO check if it is necessary to tog full error
                        }
                    });
                }
            });
    }
    catch (e){
        console.log(e);
    }


}

emitter.on("start", function(message) {
    updateSkydns(message.id, true);
});

emitter.on("die", function(message) {
    updateSkydns(message.id, false);
});

emitter.start();
