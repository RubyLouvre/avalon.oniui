var http = require('http'),
    send = require('send'),
    url = require('url'),
    log = require('access-log');

var app,
    sockets = {},
    nextSocketId = 0;

module.exports = {
    install: function() {
        app = http.createServer(function(req, res){
            //log(req, res);
            send(req, url.parse(req.url).pathname, {root: process.cwd()})
                .pipe(res);
        }).listen(3000);

        app.on('connection', function (socket) {
            // Add a newly connected socket
            var socketId = nextSocketId++;
            sockets[socketId] = socket;

            // Remove the socket when it closes
            socket.on('close', function () {
                delete sockets[socketId];
            });
        });
    },
    close: function() {
        app.close();
        // Destroy all open sockets
        for (var socketId in sockets) {
            //console.log('socket', socketId, 'destroyed');
            sockets[socketId].destroy();
        }
    }
};
