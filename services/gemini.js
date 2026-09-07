const axios = require("axios");

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDjT2qHWXwqOoHCg_9e4ig6feISaUu-rN0";
const MODEL = "gemini-2.5-flash";

async function geminiQuery(text, options = {}) {
  if (!API_KEY) throw new Error("No hay API key de Gemini configurada");

  const body = {
    contents: [{ role: "user", parts: [{ text }] }]
  };

  if (options.systemPrompt) {
    body.systemInstruction = { parts: [{ text: options.systemPrompt }] };
  }

  let response;
  try {
    response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      body,
      { headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY } }
    );
  } catch (error) {
    const detail = error?.response?.data?.error?.message || error.message;
    throw new Error(`Error de Gemini: ${detail}`);
  }

  const messageText =
    response.data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";

  if (!messageText) throw new Error("Gemini no devolvio una respuesta");

  return { response: messageText.trim(), conversationID: null, responseID: null, choiceID: null };
}

module.exports = { geminiQuery };
