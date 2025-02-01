const os = require("os");

class ServerMonitor {
  constructor() {
    this.metrics = {
      activeRooms: 0,
      activePlayers: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      uptime: 0,
    };
    this.startMonitoring();
  }

  startMonitoring() {
    setInterval(() => {
      this.updateMetrics();
    }, 5000);
  }

  updateMetrics() {
    const rooms = require("../models/GameRoom").rooms;

    this.metrics = {
      activeRooms: rooms.size,
      activePlayers: Array.from(rooms.values()).reduce(
        (acc, room) => acc + room.players.size,
        0
      ),
      cpuUsage: os.loadavg()[0],
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
      uptime: process.uptime(),
    };

    // Log if reaching critical levels
    if (this.metrics.cpuUsage > 80 || this.metrics.memoryUsage > 80) {
      console.warn("Server resources reaching critical levels:", this.metrics);
    }
  }

  getMetrics() {
    return this.metrics;
  }
}

const serverMonitor = new ServerMonitor();
module.exports = serverMonitor;
