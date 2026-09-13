// services/orbitia.js
const axios = require("axios");

const DELIRIUS_BASE = "https://api.delirius.online";

// La respuesta de este endpoint a veces trae basura pegada al inicio
// (ej. "http://googleusercontent.com/card_content/0\n" en preguntas de
// clima/datos en vivo) — parece un artefacto de "grounding" de su backend,
// no algo que deba llegarle al usuario final. Se limpia antes de devolver.
function cleanResponseText(text) {
  return String(text || "")
    .replace(/^https?:\/\/googleusercontent\.com\/[^\n]*\n+/i, "")
    .trim();
}

async function askOrbitIa(text) {
  try {
    const { data } = await axios.get(`${DELIRIUS_BASE}/ia/chatgpt`, {
      params: { q: text },
      timeout: 25000
    });

    if (!data || data.status !== true || !data.data) {
      return { status: false, error: "Orbit IA no devolvió una respuesta" };
    }

    const cleaned = cleanResponseText(data.data);
    if (!cleaned) {
      return { status: false, error: "Orbit IA no devolvió una respuesta" };
    }

    return { status: true, response: cleaned };
  } catch (error) {
    return { status: false, error: error.message || "No se pudo contactar a Orbit IA" };
  }
}

module.exports = { askOrbitIa };
