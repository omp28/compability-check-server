const { GoogleGenerativeAI } = require("@google/generative-ai");

class PlanDateService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Fallback date plans in case of API failure
this.fallbackDatePlans = [
  {
    dateVibe: "Late-night stargazing under cozy blankets",
    aesthetic: "cottagecore",
    emoji: "🌌✨",
    coupleHashtag: "#UnderTheStars",
  },
  {
    dateVibe: "Sunset picnic with matching playlists",
    aesthetic: "boho",
    emoji: "🌅🎶",
    coupleHashtag: "#GoldenHourLove",
  },
  {
    dateVibe: "DIY cooking class at home with wine",
    aesthetic: "rustic",
    emoji: "🍷👩‍🍳",
    coupleHashtag: "#CookingWithLove",
  },
  {
    dateVibe: "Thrilling amusement park adventure",
    aesthetic: "retro-fun",
    emoji: "🎢🎪",
    coupleHashtag: "#RollerCoasterRomance",
  },
  {
    dateVibe: "Chic rooftop dinner with city lights",
    aesthetic: "modern-lux",
    emoji: "🌃🍽️",
    coupleHashtag: "#CityLoveAffair",
  },
  {
    dateVibe: "Vintage movie night at a drive-in",
    aesthetic: "retro",
    emoji: "🎬🚗",
    coupleHashtag: "#ClassicRomance",
  },
  {
    dateVibe: "Beach bonfire with marshmallows and music",
    aesthetic: "coastal-chill",
    emoji: "🔥🌊",
    coupleHashtag: "#BeachsideBliss",
  },
  {
    dateVibe: "Nature hike ending with a scenic view",
    aesthetic: "adventurous",
    emoji: "🏞️🥾",
    coupleHashtag: "#TrailblazingLove",
  },
  {
    dateVibe: "Coffee shop hop with deep conversations",
    aesthetic: "minimalist",
    emoji: "☕💬",
    coupleHashtag: "#CaffeineAndConnection",
  },
  {
    dateVibe: "Museum day followed by wine tasting",
    aesthetic: "artsy",
    emoji: "🎨🍷",
    coupleHashtag: "#ArtAndWine",
  },
  {
    dateVibe: "Game night with friendly competition",
    aesthetic: "playful",
    emoji: "🎮🏆",
    coupleHashtag: "#PlayerOneAndTwo",
  },
  {
    dateVibe: "Camping under the stars with s'mores",
    aesthetic: "outdoorsy",
    emoji: "🏕️🔥",
    coupleHashtag: "#StarryCampVibes",
  },
  {
    dateVibe: "Bookstore browsing and coffee breaks",
    aesthetic: "intellectual",
    emoji: "📚☕",
    coupleHashtag: "#LitLove",
  },
  {
    dateVibe: "Spontaneous road trip to nowhere",
    aesthetic: "free-spirited",
    emoji: "🚗🗺️",
    coupleHashtag: "#WanderlustDuo",
  },
  {
    dateVibe: "Spa day with massages and relaxation",
    aesthetic: "zen",
    emoji: "🧖‍♀️🌸",
    coupleHashtag: "#RelaxAndReconnect",
  },
  {
    dateVibe: "Karaoke night with silly duets",
    aesthetic: "funky",
    emoji: "🎤🎶",
    coupleHashtag: "#SingYourHeartOut",
  },
  {
    dateVibe: "Farmers' market stroll with fresh treats",
    aesthetic: "earthy",
    emoji: "🍓🛒",
    coupleHashtag: "#FarmToTableLove",
  },
  {
    dateVibe: "Painting session with wine and laughter",
    aesthetic: "creative",
    emoji: "🎨🍷",
    coupleHashtag: "#ArtisticAffection",
  },
  {
    dateVibe: "Ice skating followed by hot cocoa",
    aesthetic: "winter-wonderland",
    emoji: "⛸️☕",
    coupleHashtag: "#FrozenMoments",
  },
  {
    dateVibe: "Sunrise yoga session by the beach",
    aesthetic: "serene",
    emoji: "🌅🧘",
    coupleHashtag: "#MorningBliss",
  },
  {
    dateVibe: "Exploring a flea market for hidden treasures",
    aesthetic: "vintage",
    emoji: "🕰️🔍",
    coupleHashtag: "#TreasureHuntLove",
  },
  {
    dateVibe: "Baking cookies and decorating them together",
    aesthetic: "homely",
    emoji: "🍪🎨",
    coupleHashtag: "#SweetMoments",
  },
  {
    dateVibe: "Attending a live jazz concert under the stars",
    aesthetic: "sophisticated",
    emoji: "🎷✨",
    coupleHashtag: "#JazzAndRomance",
  },
  {
    dateVibe: "Plant shopping and potting session",
    aesthetic: "green-thumb",
    emoji: "🌱🪴",
    coupleHashtag: "#GrowingTogether",
  },
  {
    dateVibe: "Indoor fort-building and movie marathon",
    aesthetic: "cozy",
    emoji: "🏰🍿",
    coupleHashtag: "#FortOfLove",
  },
  {
    dateVibe: "Exploring a botanical garden hand-in-hand",
    aesthetic: "romantic",
    emoji: "🌺👫",
    coupleHashtag: "#BloomingLove",
  },
  {
    dateVibe: "Sushi-making class with sake tasting",
    aesthetic: "elegant",
    emoji: "🍣🍶",
    coupleHashtag: "#SushiAndSake",
  },
  {
    dateVibe: "Stargazing with a telescope and astrology talk",
    aesthetic: "celestial",
    emoji: "🔭✨",
    coupleHashtag: "#CosmicConnection",
  },
  {
    dateVibe: "Visiting a cat café for cuddles and coffee",
    aesthetic: "wholesome",
    emoji: "🐱☕",
    coupleHashtag: "#PurrfectDate",
  },
];
}

async generateDatePlan(matchData) {
    try {
      // Simply return a random fallback plan
      const fallback = this.getRandomFallbackPlan();
      return {
        ...fallback,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error generating fallback date plan:", error);
      // In case of any errors, return the first fallback plan as a last resort
      return {
        ...this.fallbackDatePlans[0],
        generatedAt: new Date().toISOString(),
      };
    }
  }

  getRandomFallbackPlan() {
    return this.fallbackDatePlans[
      Math.floor(Math.random() * this.fallbackDatePlans.length)
    ];
  }
}

const planDateService = new PlanDateService();
module.exports = { planDateService };
