const CronJob = require('cron').CronJob;
const { exec } = require("child_process");
const cpuCount = require('os').cpus().length;
const events = require('events');
const eventEmitter = new events.EventEmitter();
const redisClient = require("redis").createClient({db: 10});
const jsonpack = require('jsonpack/main');
const webSockets = require('./websocket.js');

eventEmitter.on('cron-finished', (remainingCommandsCount, timeStamp, stats) => {
    if (remainingCommandsCount === 0) {
        redisClient.set(timeStamp, jsonpack.pack(stats), 'EX', 10800); // three hours ttl
        stats.id = timeStamp;
        webSockets.forEach(socket => {
            socket.send(JSON.stringify(stats));
        });
    }

});

new CronJob('*/5 * * * * *', function() {
    let timeStamp = Math.floor(Date.now() / 1000);
    let remainingCommandsCount = 2;
    let stats = {};

    exec("ps aux", (error, stdout, stderr) => {
        stdout = stdout.trim().split("\n");
        let headers = stdout.shift().split(/\s+/g);
        let data = [];

        let memory = 0;
        let cpu = 0;

        stdout.forEach(element => {
            element = element.split(/\s+/g);
            let value = {};
            for (let i = 0; i<headers.length; i++) {
                value[headers[i]] = i === headers.length - 1 ? element.join(' ') : element.shift();

                if (!isNaN(value[headers[i]])) {
                    if (headers[i] === '%CPU') cpu += parseFloat(value[headers[i]]);
                    if (headers[i] === '%MEM') memory += parseFloat(value[headers[i]]);
                }
            }
            data.push(value);
        });

        cpu/=cpuCount;

        stats.processes = {
            cpuTotal: cpu.toFixed(2),
            memoryTotal: memory.toFixed(2),
            processes: data,
        };

        eventEmitter.emit('cron-finished', --remainingCommandsCount, timeStamp, stats);
    });

    let credentials = process.env.MYSQL_CREDENTIALS || '';
    exec(`mysql ${credentials} -e 'show processlist'`, (error, stdout, stderr) => {
        stdout = stdout.trim().split("\n");
        let headers = stdout.shift().split("\t");
        let data = [];

        stdout.forEach(element => {
            let value = {};
            element.split("\t").forEach((item, index) => {
                value[headers[index]] = item;
            });

            data.push(value);
        });
        stats.mysqlProcesses = data;

        eventEmitter.emit('cron-finished', --remainingCommandsCount, timeStamp, stats);
    });
}).start();