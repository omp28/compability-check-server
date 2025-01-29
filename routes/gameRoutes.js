const express = require("express");
const router = express.Router();
const { rooms, GameRoom } = require("../models/GameRoom");
const { generateRoomCode } = require("../utils/helpers");

router.post("/create-room", (req, res) => {
  const { gender } = req.body;
  if (!gender) {
    return res.status(400).json({ message: "Gender is required" });
  }

  const roomCode = generateRoomCode(rooms);
  rooms.set(roomCode, new GameRoom(roomCode, gender));

  res.json({ roomCode });
});

router.post("/validate-room", (req, res) => {
  const { roomId } = req.body;
  const room = rooms.get(roomId);

  if (!room) {
    return res.status(404).json({
      valid: false,
      message: "Room not found",
    });
  }

  if (room.players.size >= 2) {
    return res.status(400).json({
      valid: true,
      canJoin: false,
      message: "Room is full",
    });
  }

  res.json({
    valid: true,
    canJoin: true,
    hostGender: room.hostGender,
  });
});

router.post("/join-room", (req, res) => {
  const { roomCode, gender } = req.body;

  if (!roomCode || !gender) {
    return res
      .status(400)
      .json({ message: "Room code and gender are required" });
  }

  const room = rooms.get(roomCode);
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  if (room.players.size >= 2) {
    return res.status(400).json({ message: "Room is full" });
  }

  if (gender === room.hostGender) {
    return res
      .status(400)
      .json({ message: "Partner must be of different gender" });
  }

  res.json({ success: true });
});

module.exports = router;
