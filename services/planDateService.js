const { GoogleGenerativeAI } = require("@google/generative-ai");

class PlanDateService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async generateDatePlan(matchData) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = this.createPrompt(matchData);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return this.parseResponse(response.text());
  }

  createPrompt(matchData) {
    const matchedAnswers = matchData.matchResults
      .filter((result) => result.matched)
      .map((result) => ({
        question: result.question,
        answer: result.playerAnswers.male.answerText,
      }));

    return `Based on these matched preferences:
    ${matchedAnswers.map((a) => `${a.question}: ${a.answer}`).join("\n")}
    
    Generate a JSON response with:
    1. dateVibe: One-line Gen Z description of their perfect date (max 100 chars)
    2. aesthetic: One aesthetic keyword that defines their relationship vibe
    3. emoji: Single emoji that best represents their connection
    4. coupleHashtag: Trendy couple hashtag based on their preferences
    
    Return just the JSON object without code blocks or backticks.`;
  }

  parseResponse(text) {
    try {
      // Remove markdown code block syntax if present
      const cleanText = text.replace(/```json\n?|\n?```/g, "");
      const parsed = JSON.parse(cleanText);

      return {
        ...parsed,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("JSON parsing error:", error);
      return {
        dateVibe: "Cozy vibes with shared interests",
        aesthetic: "cottagecore",
        emoji: "✨",
        coupleHashtag: "#SoulMateSynergy",
        generatedAt: new Date().toISOString(),
      };
    }
  }
}

const planDateService = new PlanDateService();
module.exports = { planDateService };
