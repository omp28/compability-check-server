require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { setupSocketHandlers } = require("./socket/socketHandlers");
const gameRoutes = require("./routes/gameRoutes");
const { corsOrigin } = require("./config/config");
const socketService = require("./services/socket");

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: corsOrigin, methods: ["GET", "POST"] }));
app.use(express.json());

app.use("/", gameRoutes);

// Socket.io setup
const io = new Server(server, {
  cors: { origin: corsOrigin, methods: ["GET", "POST"] },
});
socketService.init(io);

// Setup socket handlers
setupSocketHandlers(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
