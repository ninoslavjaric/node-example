const WebSocket = require('ws');
const events = require('events');
const eventEmitter = new events.EventEmitter();
const wss = new WebSocket.Server({ port: 8889 });
let webSockets = [];

wss.on('connection', function connection(ws) {
    webSockets.push(ws);
    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });

    eventEmitter.on('cron-finished', () => {
        ws.send('something');
    });
});


module.exports = webSockets;