require("dotenv").config();

module.exports = {
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  port: process.env.PORT || 3001,
  roomExpiryTime: parseInt(process.env.ROOM_EXPIRY_TIME) || 10 * 60 * 1000,
  questionTimeout: parseInt(process.env.QUESTION_TIMEOUT) || 40 * 1000,
  questions: require("../questions.json"),
  // Server capacity limits
  maxConcurrentRooms: parseInt(process.env.MAX_CONCURRENT_ROOMS) || 1000,
  maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 100,
  maxPlayersPerRoom: 2,
  // Socket limits
  maxSocketsPerIP: parseInt(process.env.MAX_SOCKETS_PER_IP) || 5,
  socketTimeout: parseInt(process.env.SOCKET_TIMEOUT) || 5000,
};
