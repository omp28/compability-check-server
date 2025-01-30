const { questions, roomExpiryTime } = require("../config/config");
const socketService = require("../services/socket");
const { gameScoring } = require("../services/gameScoring");

class GameRoom {
  constructor(roomCode, hostGender) {
    this.roomCode = roomCode;
    this.players = new Map();
    this.currentQuestion = 0;
    this.answers = new Map();
    this.gameStarted = false;
    this.createdAt = Date.now();
    this.expiryTimeout = setTimeout(() => this.handleExpiry(), 10 * 60 * 1000);
    this.questionTimeout = null;
    this.hostGender = hostGender;
    this.timeRemaining = 40;
    this.timerInterval = null;
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

  startTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timeRemaining = 40;
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;

      const io = socketService.getIO();
      io.to(this.roomCode).emit("timer_update", {
        timeRemaining: this.timeRemaining,
      });

      if (this.timeRemaining <= 0) {
        this.handleQuestionTimeout();
      }
    }, 1000);
  }

  sendQuestion() {
    if (this.currentQuestion >= questions.length) {
      this.endGame();
      return;
    }

    const question = questions[this.currentQuestion];
    this.answers.clear();
    this.timeRemaining = 40;

    if (this.questionTimeout) {
      clearTimeout(this.questionTimeout);
    }

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.startTimer();

    const questionData = {
      type: "question",
      question,
      currentQuestion: this.currentQuestion,
      totalQuestions: questions.length,
      timeRemaining: this.timeRemaining,
    };

    const io = socketService.getIO();
    io.to(this.roomCode).emit("question", questionData);
    return questionData;
  }

  submitAnswer(socketId, answer) {
    if (!this.gameStarted || this.answers.has(socketId)) return false;

    this.answers.set(socketId, answer);
    const player = this.players.get(socketId);
    if (player) {
      player.answers.push(answer);
    }

    //  scoring service
    gameScoring.addAnswer(socketId, this.currentQuestion, answer);

    const io = socketService.getIO();
    io.to(this.roomCode).emit("answer_submitted", {
      answeredBy: socketId,
      gameState: this.getGameState(),
    });

    if (this.answers.size === 2) {
      clearInterval(this.timerInterval);
      io.to(this.roomCode).emit("both_answered");

      this.currentQuestion++;
      setTimeout(() => {
        const nextQuestion = this.sendQuestion();
        if (!nextQuestion) {
          const finalScore = this.endGame();
          io.to(this.roomCode).emit("game_complete", finalScore);
        }
      }, 2000);
    }

    return true;
  }

  handleQuestionTimeout() {
    console.log(`Question ${this.currentQuestion} timed out`);
    clearInterval(this.timerInterval);

    const io = socketService.getIO();
    io.to(this.roomCode).emit("question_timeout");

    this.currentQuestion++;
    setTimeout(() => {
      this.sendQuestion();
    }, 1000);
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
    const gameScore = gameScoring.calculateScore();
    return {
      type: "gameEnd",
      score: gameScore?.score || 0,
      matchResults: gameScore?.matchResults || [],
      compatibility: gameScore?.compatibility || {
        level: "Low",
        message: "Game ended without enough data",
      },
      summary: {
        totalQuestions: gameScore?.totalQuestions || 0,
        matchedAnswers: gameScore?.matchedAnswers || 0,
      },
    };
  }

  handleExpiry() {
    const io = socketService.getIO();
    io.to(this.roomCode).emit("game_expired");
    this.cleanup();
  }

  cleanup() {
    clearTimeout(this.expiryTimeout);
    clearTimeout(this.questionTimeout);
    clearInterval(this.timerInterval);
    gameScoring.clear();
    rooms.delete(this.roomCode);
  }

  getGameState() {
    return {
      currentQuestion: this.currentQuestion,
      totalQuestions: questions.length,
      timeRemaining: this.timeRemaining,
      gameStatus: this.gameStarted ? "in_progress" : "waiting",
      partnerSubmitted: this.answers.size === 1,
    };
  }
}

// Store active rooms
const rooms = new Map();

module.exports = { GameRoom, rooms };
