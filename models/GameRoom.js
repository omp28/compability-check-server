const { questions, roomExpiryTime } = require("../config/config");
const socketService = require("../services/socket");
const { gameScoring } = require("../services/gameScoring");
// const { getRandomQuestions } = require("../config/config"); // Add this if you're using the function directly

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
    this.questions = questions();
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
    gameScoring.initializeGame(
      this.questions,
      Array.from(this.players.entries())
    );
    this.sendQuestion();
  }

  startTimer() {
    // Clear previous interval if any, to avoid overlaps
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.timeRemaining = 40;
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;

      const io = socketService.getIO();
      io.to(this.roomCode).emit("timer_update", {
        timeRemaining: this.timeRemaining,
      });

      if (this.timeRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.handleQuestionTimeout();
      }
    }, 1000);
  }

  sendQuestion() {
    if (this.currentQuestion >= this.questions.length) {
      this.endGame();
      return;
    }

    const question = this.questions[this.currentQuestion];
    this.answers.clear();
    this.timeRemaining = 40;

    // Clear any previously set timeouts and intervals
    if (this.questionTimeout) {
      clearTimeout(this.questionTimeout);
      this.questionTimeout = null;
    }

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.startTimer();

    this.questionTimeout = setTimeout(() => {
      this.handleQuestionTimeout();
    }, 40 * 1000);

    const questionData = {
      type: "question",
      question,
      currentQuestion: this.currentQuestion,
      totalQuestions: this.questions.length,
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
      this.timeRemaining = Math.max(0, this.timeRemaining - 3); // 3 second reduction
      clearInterval(this.timerInterval);
      this.timerInterval = null;

      io.to(this.roomCode).emit("both_answered");

      this.currentQuestion++;
      setTimeout(() => {
        const nextQuestion = this.sendQuestion();
        if (!nextQuestion) {
          const finalScore = this.endGame();
          io.to(this.roomCode).emit("game_complete", finalScore);
        }
      }, 1000);
    }

    return true;
  }

  handleQuestionTimeout() {
    // Clean up the current timer properly.
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.questionTimeout) {
      clearTimeout(this.questionTimeout);
      this.questionTimeout = null;
    }

    const io = socketService.getIO();
    io.to(this.roomCode).emit("question_timeout");

    this.currentQuestion++;
    this.answers.clear();

    setTimeout(() => {
      this.timeRemaining = 40;
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
    return gameScoring.calculateScore();
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
      totalQuestions: this.questions.length,
      timeRemaining: this.timeRemaining,
      gameStatus: this.gameStarted ? "in_progress" : "waiting",
      partnerSubmitted: this.answers.size === 1,
    };
  }
}

// Store active rooms
const rooms = new Map();

module.exports = { GameRoom, rooms };
