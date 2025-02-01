const rateLimit = require("express-rate-limit");
const { maxRequestsPerMinute } = require("../config/config");

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: maxRequestsPerMinute,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = limiter;
