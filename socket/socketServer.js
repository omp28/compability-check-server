const { Server } = require("socket.io");
const { setupSocketHandlers } = require("./socketHandlers");

function createSocketServer(server, corsOrigin) {
  const io = new Server(server, {
    cors: { origin: corsOrigin, methods: ["GET", "POST"] },
  });

  setupSocketHandlers(io);
  return io;
}

module.exports = { createSocketServer };
