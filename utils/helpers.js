const crypto = require("crypto");

function generateRoomCode(rooms) {
  const chars = "ACEFGHJKLPQRSTUVWXYZ23456789";
  let code;

  do {
    code = Array.from(crypto.randomBytes(6))
      .map((byte) => chars[byte % chars.length])
      .join("");
  } while (rooms.has(code));

  return code;
}

module.exports = { generateRoomCode };
