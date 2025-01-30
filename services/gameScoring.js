class GameScoring {
  constructor() {
    this.playerAnswers = new Map();
  }

  addAnswer(playerId, questionId, answer) {
    if (!this.playerAnswers.has(playerId)) {
      this.playerAnswers.set(playerId, []);
    }

    const playerAnswers = this.playerAnswers.get(playerId);
    playerAnswers.push({
      questionId,
      answer,
      timestamp: Date.now(),
    });
  }

  calculateScore() {
    if (this.playerAnswers.size !== 2) return null;

    const players = Array.from(this.playerAnswers.keys());
    const player1Answers = this.playerAnswers.get(players[0]) || [];
    const player2Answers = this.playerAnswers.get(players[1]) || [];

    const matchResults = [];
    let matchedAnswers = 0;

    const totalQuestions = Math.max(
      player1Answers.length,
      player2Answers.length
    );

    for (let i = 0; i < totalQuestions; i++) {
      const p1Answer = player1Answers[i]?.answer;
      const p2Answer = player2Answers[i]?.answer;

      const matched = p1Answer === p2Answer;
      if (matched) matchedAnswers++;

      matchResults.push({
        questionId: i,
        matched,
        playerAnswers: [p1Answer || "no answer", p2Answer || "no answer"],
      });
    }

    const score = (matchedAnswers / totalQuestions) * 100;

    return {
      totalQuestions,
      matchedAnswers,
      score,
      matchResults,
      compatibility: this.getCompatibilityLevel(score),
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

  getAnswerHistory() {
    return new Map(this.playerAnswers);
  }

  clear() {
    this.playerAnswers.clear();
  }
}

const gameScoring = new GameScoring();
module.exports = { gameScoring };
