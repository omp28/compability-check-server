module.exports = {
  corsOrigin: process.env.CORS_ORIGIN,
  roomExpiryTime: 10 * 60 * 1000, // 10 minutes
  questionTimeout: 40 * 1000, // 40 seconds
  questions: require("../questions.json"),
};
