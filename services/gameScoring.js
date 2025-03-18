class GameScoring {
  constructor() {
    this.questions = [];
    this.players = new Map();
    this.answers = new Map();
    this.summary = null;
  }

  initializeGame(questions, players) {
    this.questions = questions;
    this.players = new Map(players);
    this.answers = new Map();
    this.summary = null;

    // Initialize answer storage for each player with timestamps
    for (const [socketId] of this.players) {
      this.answers.set(socketId, new Array(questions.length).fill(null));
    }
  }

  addAnswer(socketId, questionIndex, answer) {
    if (!this.answers.has(socketId)) {
      this.answers.set(socketId, new Array(this.questions.length).fill(null));
    }

    const playerAnswers = this.answers.get(socketId);
    playerAnswers[questionIndex] = {
      answer,
      timestamp: Date.now(),
    };
    this.answers.set(socketId, playerAnswers);
  }

  calculateScore() {
    const players = Array.from(this.players.entries());
    if (players.length !== 2) return null;

    const [player1Id, player2Id] = players.map(([id]) => id);
    const player1Answers = this.answers.get(player1Id);
    const player2Answers = this.answers.get(player2Id);

    if (!player1Answers || !player2Answers) return null;

    const matchResults = this.questions.map((question, index) => {
      const p1Answer = player1Answers[index]?.answer;
      const p2Answer = player2Answers[index]?.answer;
      const matched = p1Answer === p2Answer;

      return {
        questionId: index,
        question: question.text,
        options: question.options,
        matched,
        playerAnswers: {
          [player1Id]: {
            gender: this.players.get(player1Id).gender,
            answer: p1Answer || "no answer",
            answerText: p1Answer
              ? question.options.find((opt) => opt.id === p1Answer)?.text
              : "No answer provided",
          },
          [player2Id]: {
            gender: this.players.get(player2Id).gender,
            answer: p2Answer || "no answer",
            answerText: p2Answer
              ? question.options.find((opt) => opt.id === p2Answer)?.text
              : "No answer provided",
          },
        },
      };
    });

    const matchedAnswers = matchResults.filter(
      (result) => result.matched
    ).length;
    const score = Math.round((matchedAnswers / this.questions.length) * 100);

    this.summary = {
      score,
      matchResults,
      compatibility: this.getCompatibilityLevel(score),
      summary: {
        totalQuestions: this.questions.length,
        matchedAnswers,
        unmatchedQuestions: matchResults.filter((r) => !r.matched),
      },
    };

    return this.summary;
  }

  getCompatibilityLevel(score) {
    if (score >= 80) {
      return {
        level: "High",
        message:
          "You two are extremely compatible! Your thoughts align perfectly!",
      };
    } else if (score >= 50) {
      return {
        level: "Medium",
        message:
          "You have a good connection with room to grow and learn about each other.",
      };
    } else {
      return {
        level: "Low",
        message:
          "You have different perspectives - embrace the opportunity to learn from each other!",
      };
    }
  }

  clear() {
    this.questions = [];
    this.players = new Map();
    this.answers = new Map();
    this.summary = null;
  }

  getSummary() {
    return this.summary;
  }
}

const gameScoring = new GameScoring();
module.exports = { gameScoring };
