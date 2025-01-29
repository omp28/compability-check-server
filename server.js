require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

// Game Questions
const questions = [
  {
    id: 1,
    text: "What's your ideal date night?",
    options: [
      { id: "a", text: "Romantic dinner" },
      { id: "b", text: "Movie night" },
      { id: "c", text: "Adventure activity" },
      { id: "d", text: "Cozy night in" },
    ],
  },
  // Add more questions here
];

// Store active rooms and their states
const rooms = new Map();

class GameRoom {
  constructor(roomCode, hostGender) {
    this.roomCode = roomCode;
    this.players = new Map();
    this.currentQuestion = 0;
    this.answers = new Map();
    this.gameStarted = false;
    this.createdAt = Date.now();
    this.expiryTimeout = setTimeout(() => this.handleExpiry(), 10 * 60 * 1000); // 10 minutes
    this.questionTimeout = null;
    this.hostGender = hostGender;
  }

  addPlayer(socketId, gender) {
    if (this.players.size >= 2) return false;
    if (this.players.size === 1 && gender === this.hostGender) return false;

    this.players.set(socketId, {
      gender,
      connected: true,
      answers: [],
    });

    if (this.players.size === 2) {
      this.startGame();
    }

    return true;
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
    if (this.players.size === 0) {
      this.cleanup();
    }
  }

  startGame() {
    this.gameStarted = true;
    this.currentQuestion = 0;
    this.sendQuestion();
  }

  sendQuestion() {
    if (this.currentQuestion >= questions.length) {
      this.endGame();
      return;
    }

    const question = questions[this.currentQuestion];
    this.answers.clear();

    // Reset question timer
    if (this.questionTimeout) {
      clearTimeout(this.questionTimeout);
    }

    this.questionTimeout = setTimeout(() => {
      this.handleQuestionTimeout();
    }, 40 * 1000); // 40 seconds per question

    return {
      type: "question",
      question,
      currentQuestion: this.currentQuestion,
      totalQuestions: questions.length,
      timeRemaining: 40,
    };
  }

  submitAnswer(socketId, answer) {
    if (!this.gameStarted || this.answers.has(socketId)) return false;

    this.answers.set(socketId, answer);
    const player = this.players.get(socketId);
    player.answers.push(answer);

    if (this.answers.size === 2) {
      clearTimeout(this.questionTimeout);
      this.currentQuestion++;
      setTimeout(() => this.sendQuestion(), 2000);
    }

    return true;
  }

  handleQuestionTimeout() {
    this.currentQuestion++;
    this.sendQuestion();
  }

  calculateScore() {
    let totalMatches = 0;
    const playerAnswers = Array.from(this.players.values()).map(
      (p) => p.answers
    );

    for (let i = 0; i < questions.length; i++) {
      if (playerAnswers[0][i] === playerAnswers[1][i]) {
        totalMatches++;
      }
    }

    return Math.round((totalMatches / questions.length) * 100);
  }

  endGame() {
    const score = this.calculateScore();
    return {
      type: "gameEnd",
      score,
    };
  }

  handleExpiry() {
    io.to(this.roomCode).emit("game_expired");
    this.cleanup();
  }

  cleanup() {
    clearTimeout(this.expiryTimeout);
    clearTimeout(this.questionTimeout);
    rooms.delete(this.roomCode);
  }

  getGameState() {
    return {
      currentQuestion: this.currentQuestion,
      totalQuestions: questions.length,
      timeRemaining: 40,
      gameStarted: this.gameStarted,
      partnerSubmitted: this.answers.size === 1,
    };
  }
}

// Generate unique room code
function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code;
  do {
    code = Array.from({ length: 6 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
  } while (rooms.has(code));
  return code;
}

// API Routes
app.post("/create-room", (req, res) => {
  const { gender } = req.body;
  if (!gender) {
    return res.status(400).json({ message: "Gender is required" });
  }

  const roomCode = generateRoomCode();
  rooms.set(roomCode, new GameRoom(roomCode, gender));

  res.json({ roomCode });
});

// Add to server.js
app.post("/validate-room", (req, res) => {
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

app.post("/join-room", (req, res) => {
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

// Socket.io connection handling
io.on("connection", (socket) => {
  let currentRoom = null;

  socket.on("join_game", ({ roomCode, gender }) => {
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }

    if (room.addPlayer(socket.id, gender)) {
      currentRoom = room;
      socket.join(roomCode);

      const gameState = room.getGameState();
      socket.emit("game_state", gameState);

      if (room.players.size === 2) {
        io.to(roomCode).emit("partner_connected");
      }
    } else {
      socket.emit("error", "Could not join room");
    }
  });

  socket.on("submit_answer", ({ roomCode, answer }) => {
    const room = rooms.get(roomCode);
    if (!room) return;

    if (room.submitAnswer(socket.id, answer)) {
      io.to(roomCode).emit("answer_submitted", {
        answeredBy: socket.id,
        gameState: room.getGameState(),
      });
    }
  });

  socket.on("disconnect", () => {
    if (currentRoom) {
      currentRoom.removePlayer(socket.id);
      socket.to(currentRoom.roomCode).emit("partner_disconnected");
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
