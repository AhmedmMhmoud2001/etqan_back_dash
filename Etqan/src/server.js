const http = require('http');
const app = require('./app');
const config = require('./config');
const socket = require('./socket');

const httpServer = http.createServer(app);
socket.init(httpServer);

httpServer.listen(config.port, () => {
  console.log(`Server running on port ${config.port} (${config.env})`);
  console.log('Socket.IO enabled for chat, channels, and notifications');
});

module.exports = httpServer;
