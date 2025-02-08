require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const limiter = require("./middleware/rateLimiter");
const serverCapacityMiddleware = require("./middleware/serverCapacity");
const { setupSocketHandlers } = require("./socket/socketHandlers");
const gameRoutes = require("./routes/gameRoutes");
const {
  corsOrigin,
  port,
  socketTimeout,
  maxSocketsPerIP,
} = require("./config/config");
const socketService = require("./services/socket");
const serverMonitor = require("./utils/monitoring");

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({ origin: corsOrigin, methods: ["GET", "POST"] }));
app.use(express.json({ limit: "10kb" }));
app.use(limiter);
app.use(serverCapacityMiddleware);

app.use("/", gameRoutes);

app.get("/metrics", (req, res) => {
  res.json(serverMonitor.getMetrics());
});

const io = new Server(server, {
  cors: { origin: corsOrigin, methods: ["GET", "POST"] },
  connectionTimeout: socketTimeout,
  maxHttpBufferSize: 1e4, // 10KB
  pingTimeout: 5000,
  pingInterval: 10000,
});

const socketConnections = new Map();

io.use((socket, next) => {
  const clientIp = socket.handshake.address;
  const currentConnections = socketConnections.get(clientIp) || 0;

  if (currentConnections >= maxSocketsPerIP) {
    return;
  }

  socketConnections.set(clientIp, currentConnections + 1);

  socket.on("disconnect", () => {
    const connections = socketConnections.get(clientIp);
    if (connections > 1) {
      socketConnections.set(clientIp, connections - 1);
    } else {
      socketConnections.delete(clientIp);
    }
  });

  next();
});

socketService.init(io);
setupSocketHandlers(io);

server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM. Performing graceful shutdown...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
