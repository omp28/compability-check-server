class GameScoring {
  constructor() {
    this.playerAnswers = new Map();
    this.questions = [];
    this.playerInfo = new Map();
  }

  initializeGame(questions, players) {
    this.questions = questions;
    // this.questions = Array.isArray(questions) ? questions : [];

    players.forEach(([playerId, playerData]) => {
      this.playerInfo.set(playerId, {
        gender: playerData.gender,
        answers: [],
      });
    });
  }

  addAnswer(playerId, questionId, answer) {
    if (!this.playerInfo.has(playerId)) {
      return false;
    }

    const playerData = this.playerInfo.get(playerId);
    playerData.answers[questionId] = {
      answer,
      timestamp: Date.now(),
    };
  }

  calculateScore() {
    if (this.playerInfo.size !== 2) return null;

    if (!Array.isArray(this.questions)) {
      console.error("Questions is not an array:", this.questions);
      return null;
    }

    const players = Array.from(this.playerInfo.keys());
    const player1Data = this.playerInfo.get(players[0]);
    const player2Data = this.playerInfo.get(players[1]);

    const matchResults = this.questions.map((question, index) => {
      const p1Answer = player1Data.answers[index]?.answer;
      const p2Answer = player2Data.answers[index]?.answer;
      const matched = p1Answer === p2Answer;

      return {
        questionId: index,
        question: question.text,
        options: question.options,
        matched,
        playerAnswers: {
          [players[0]]: {
            gender: player1Data.gender,
            answer: p1Answer || "no answer",
            answerText: p1Answer
              ? question.options.find((opt) => opt.id === p1Answer)?.text
              : "No answer provided",
          },
          [players[1]]: {
            gender: player2Data.gender,
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

    return {
      score,
      matchResults,
      compatibility: this.getCompatibilityLevel(score),
      summary: {
        totalQuestions: this.questions.length,
        matchedAnswers,
        unmatchedQuestions: matchResults.filter((r) => !r.matched),
      },
    };
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
    this.playerAnswers.clear();
    this.questions = [];
    this.playerInfo.clear();
  }
}

const gameScoring = new GameScoring();
module.exports = { gameScoring };
