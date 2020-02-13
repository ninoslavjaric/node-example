const redisScan = require('node-redis-scan');
const client = require("redis").createClient({db: 10});
const redisScanner = new redisScan(client);
const jsonpack = require('jsonpack/main');

const Fetcher = {
    getStatuses: () => new Promise((resolve, reject) => {
        try {
            redisScanner.scan('*', (error, reply) => {
                let keySize = reply.length;
                let records = [];
                reply.forEach(key => {
                    client.get(key, (error, data) => {
                        data = jsonpack.unpack(data);
                        let item = {
                            id: key,
                            cpu: data.processes.cpuTotal || data.processes.cpuTotal.toFixed(2),
                            memory: data.processes.memoryTotal || data.processes.memoryTotal.toFixed(2),
                        };
                        records.push(item);
                        if (--keySize === 0) {
                            resolve(records);
                        }
                    });
                });
            });
        } catch (e) {
            reject(e);
        }
    }),
    getStatus: key => new Promise((resolve, reject) => {
        client.get(key, (error, value) => {
            resolve(jsonpack.unpack(value));
        });
    })

};

module.exports = Fetcher;