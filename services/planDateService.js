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
      const model = this.genAI.getGenerativeModel({
        model: "gemini-pro",
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_ONLY_HIGH",
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_ONLY_HIGH",
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_ONLY_HIGH",
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_ONLY_HIGH",
          },
        ],
      });
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

    return `Please help create a fun date idea based on these shared interests and preferences:
    ${matchedAnswers
      .map((a) => `Interest: ${a.question}, Preference: ${a.answer}`)
      .join("\n")}
    
    Please suggest a date plan in JSON format with these elements:
    {
      "dateVibe": "A brief, friendly description of a suitable date activity (max 100 chars)",
      "aesthetic": "A single word describing the style",
      "emoji": "A family-friendly Single emoji that best represents their connection",
      "coupleHashtag": "A Trendy couple hashtag for social media tag"
    }`;
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
