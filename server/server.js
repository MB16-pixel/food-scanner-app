require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer for handling image file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// Initialize the Google Gen AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper function to automatically retry async calls with backoff
async function retryWithBackoff(fn, retries = 3, delay = 2000) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    console.warn(`Gemini busy/unavailable. Retrying in ${delay}ms... (${error.message})`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    // Double the delay for the next attempt (exponential backoff)
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

// 1. Health check route
app.get("/api/health", (req, res) => {
  res.json({ message: "Backend is connected and running successfully!" });
});

// 2. Scan ingredients route
app.post("/api/scan-ingredients", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };

    // Wrap the Gemini call inside the retry mechanism
    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          imagePart,
          "Analyze this food ingredient label. Extract the full ingredient list, flag any common allergens or unhealthy additives, and give a brief health safety summary. The brief health summary should be given in the beginning. Use colors to give a visual aid to give the safety spectrum",
        ],
      });
    }, 3, 2000); // Tries up to 3 times, starting with a 2-second delay

    res.json({ analysis: response.text });
  } catch (error) {
    console.error("Gemini error after retries:", error);
    res.status(500).json({ error: "Failed to analyze ingredient image due to high server traffic. Please try again." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
