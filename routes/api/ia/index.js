const express = require("express");
const { geminiQuery } = require("../../../services/gemini");

const router = express.Router();

router.get("/", async (req, res) => {
  const { text, conversationID, responseID, choiceID, promptSystem } = req.query;
  if (!text) return res.status(400).json({ status: false, creator: "Orbit", error: "El parámetro text es requerido" });

  try {
    const result = await geminiQuery(text, {
      conversationID,
      responseID,
      choiceID,
      systemPrompt: promptSystem
    });
    res.json({ status: true, creator: "Orbit", access: "vip", data: result, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: false, creator: "Orbit", error: error.message });
  }
});

module.exports = router;
