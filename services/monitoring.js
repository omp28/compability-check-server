const promClient = require("prom-client");

class MonitoringService {
  constructor() {
    this.register = new promClient.Registry();

    this.activeRooms = new promClient.Gauge({
      name: "game_active_rooms",
      help: "Number of active game rooms",
      registers: [this.register],
    });

    this.activePlayers = new promClient.Gauge({
      name: "game_active_players",
      help: "Number of active players",
      registers: [this.register],
    });

    this.questionResponseTime = new promClient.Histogram({
      name: "game_question_response_time",
      help: "Time taken to answer questions",
      buckets: [5, 10, 15, 20, 30, 40],
      registers: [this.register],
    });

    this.socketConnections = new promClient.Gauge({
      name: "socket_connections",
      help: "Number of active socket connections",
      registers: [this.register],
    });
  }

  updateRoomCount(count) {
    this.activeRooms.set(count);
  }

  updatePlayerCount(count) {
    this.activePlayers.set(count);
  }

  recordQuestionResponse(time) {
    this.questionResponseTime.observe(time);
  }

  updateSocketConnections(count) {
    this.socketConnections.set(count);
  }

  getMetrics() {
    return this.register.metrics();
  }
}

const monitoring = new MonitoringService();
module.exports = monitoring;
