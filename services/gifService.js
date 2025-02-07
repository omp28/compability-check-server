const fs = require("fs");
const path = require("path");

class GifGenerationService {
  constructor() {
    this.savedGifPath = path.join(__dirname, "bg-heart.gif");
  }

  async generateGif(matchData) {
    try {
      // Read the file as base64
      const gifBuffer = fs.readFileSync(this.savedGifPath);
      const gifBase64 = gifBuffer.toString("base64");

      return {
        success: true,
        data: `data:image/gif;base64,${gifBase64}`,
      };
    } catch (error) {
      console.error("GIF Retrieval Error:", error);
      return {
        success: false,
        error: "Failed to retrieve GIF",
      };
    }
  }
}

const gifService = new GifGenerationService();
module.exports = { gifService };
