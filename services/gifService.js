const axios = require("axios");

class GifGenerationService {
  constructor() {
    this.videoBackendUrl = process.env.VIDEO_BACKEND_URL;
  }

  async generateGif(matchData) {
    try {
      const response = await axios.post(
        `${this.videoBackendUrl}/api/generate-match-gif`,
        matchData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to generate GIF");
      }

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error("GIF Generation Error:", error);
      return {
        success: false,
        error: "Failed to generate GIF",
      };
    }
  }
}

const gifService = new GifGenerationService();
module.exports = { gifService };
