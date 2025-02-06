const { GoogleGenerativeAI } = require("@google/generative-ai");

class PlanDateService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Fallback date plans in case of API failure
    this.fallbackDatePlans = [
      {
        dateVibe: "Late-night stargazing under cozy blankets",
        aesthetic: "cottagecore",
        emoji: "🌌",
        coupleHashtag: "#UnderTheStars",
      },
      {
        dateVibe: "Sunset picnic with matching playlists",
        aesthetic: "boho",
        emoji: "🌅",
        coupleHashtag: "#GoldenHourLove",
      },
      {
        dateVibe: "DIY cooking class at home with wine",
        aesthetic: "rustic",
        emoji: "🍷",
        coupleHashtag: "#CookingWithLove",
      },
      {
        dateVibe: "Thrilling amusement park adventure",
        aesthetic: "retro-fun",
        emoji: "🎢",
        coupleHashtag: "#RollerCoasterRomance",
      },
      {
        dateVibe: "Chic rooftop dinner with city lights",
        aesthetic: "modern-lux",
        emoji: "🌃",
        coupleHashtag: "#CityLoveAffair",
      },
      {
        dateVibe: "Vintage movie night at a drive-in",
        aesthetic: "retro",
        emoji: "🎬",
        coupleHashtag: "#ClassicRomance",
      },
      {
        dateVibe: "Beach bonfire with marshmallows and music",
        aesthetic: "coastal-chill",
        emoji: "🔥",
        coupleHashtag: "#BeachsideBliss",
      },
      {
        dateVibe: "Nature hike ending with a scenic view",
        aesthetic: "adventurous",
        emoji: "🏞️",
        coupleHashtag: "#TrailblazingLove",
      },
      {
        dateVibe: "Coffee shop hop with deep conversations",
        aesthetic: "minimalist",
        emoji: "☕",
        coupleHashtag: "#CaffeineAndConnection",
      },
      {
        dateVibe: "Museum day followed by wine tasting",
        aesthetic: "artsy",
        emoji: "🎨",
        coupleHashtag: "#ArtAndWine",
      },
      {
        dateVibe: "Game night with friendly competition",
        aesthetic: "playful",
        emoji: "🎮",
        coupleHashtag: "#PlayerOneAndTwo",
      },
      {
        dateVibe: "Camping under the stars with s'mores",
        aesthetic: "outdoorsy",
        emoji: "🏕️",
        coupleHashtag: "#StarryCampVibes",
      },
      {
        dateVibe: "Bookstore browsing and coffee breaks",
        aesthetic: "intellectual",
        emoji: "📚",
        coupleHashtag: "#LitLove",
      },
      {
        dateVibe: "Spontaneous road trip to nowhere",
        aesthetic: "free-spirited",
        emoji: "🚗",
        coupleHashtag: "#WanderlustDuo",
      },
      {
        dateVibe: "Spa day with massages and relaxation",
        aesthetic: "zen",
        emoji: "🧖",
        coupleHashtag: "#RelaxAndReconnect",
      },
    ];
  }

  async generateDatePlan(matchData) {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = this.createPrompt(matchData);
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return this.parseResponse(response.text());
    } catch (error) {
      console.error("Gemini API error:", error);
      // Fallback to a random date plan
      const fallback =
        this.fallbackDatePlans[
          Math.floor(Math.random() * this.fallbackDatePlans.length)
        ];
      return {
        ...fallback,
        generatedAt: new Date().toISOString(),
      };
    }
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
    
    Generate a JSON response which is totally positive with:
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
      // Fallback to a random date plan
      const fallback =
        this.fallbackDatePlans[
          Math.floor(Math.random() * this.fallbackDatePlans.length)
        ];
      return {
        ...fallback,
        generatedAt: new Date().toISOString(),
      };
    }
  }
}

const planDateService = new PlanDateService();
module.exports = { planDateService };
