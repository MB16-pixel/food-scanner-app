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

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [
        imagePart,
        "Analyze this food ingredient label. Extract the full ingredient list, flag any common allergens or unhealthy additives, and give a brief health safety summary. The brief health summary should be given in the beginning. Use colors to give a visual aid to give the safety spectrum",
      ],
    });

    res.json({ analysis: response.text });
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: "Failed to analyze ingredient image" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
