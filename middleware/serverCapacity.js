const { rooms } = require("../models/GameRoom");
const { maxConcurrentRooms } = require("../config/config");

const serverCapacityMiddleware = (req, res, next) => {
  if (rooms.size >= maxConcurrentRooms) {
    return res.status(503).json({
      message: "Server at capacity. Please try again later.",
    });
  }
  next();
};

module.exports = serverCapacityMiddleware;
