let avail = require('node:os').availableParallelism;
const numCPUs = avail();
console.log(`numCPUs: ${numCPUs}`);

