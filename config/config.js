require("dotenv").config();

const path = require("path");
const questionSet1 = require("../questionSet1.json");
const questionSet2 = require("../questionSet2.json");
const questionSet3 = require("../questionSet3.json");

const TOTAL_QUESTIONS = process.env.TOTAL_QUESTIONS || 7;

const getRandomQuestions = () => {
  const allQuestions = [...questionSet1, ...questionSet2, ...questionSet3];
  return allQuestions.sort(() => 0.5 - Math.random()).slice(0, TOTAL_QUESTIONS);
};

module.exports = {
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  port: process.env.PORT || 3001,
  roomExpiryTime: parseInt(process.env.ROOM_EXPIRY_TIME) || 10 * 60 * 1000,
  questionTimeout: parseInt(process.env.QUESTION_TIMEOUT) || 40 * 1000,
  questions: () => getRandomQuestions(),
  // Server capacity limits
  maxConcurrentRooms: parseInt(process.env.MAX_CONCURRENT_ROOMS) || 1000,
  maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 100,
  maxPlayersPerRoom: 2,
  // Socket limits
  maxSocketsPerIP: parseInt(process.env.MAX_SOCKETS_PER_IP) || 5,
  socketTimeout: parseInt(process.env.SOCKET_TIMEOUT) || 5000,
};
