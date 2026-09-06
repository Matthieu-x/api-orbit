const axios = require("axios");

const API_KEY = "AIzaSyDjT2qHWXwqOoHCg_9e4ig6feISaUu-rN0";
const MODEL = "gemini-2.5-flash";

async function geminiQuery(text, options = {}) {
  if (!API_KEY) {
    throw new Error("No hay API key configurada");
  }

  const contents = [
    {
      role: "user",
      parts: [{ text }]
    }
  ];

  if (options.systemPrompt) {
    contents.unshift({
      role: "user",
      parts: [
        {
          text: `Instrucciones:\n${options.systemPrompt}`
        }
      ]
    });
  }

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    { contents },
    {
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY
      }
    }
  );

  const messageText =
    response.data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("") || "";

  if (!messageText) {
    throw new Error("Gemini no devolvió una respuesta");
  }

  return {
    response: messageText.trim(),
    conversationID: null,
    responseID: null,
    choiceID: null
  };
}

module.exports = { geminiQuery };