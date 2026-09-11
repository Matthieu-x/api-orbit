const axios = require("axios");

// AnimeChan (https://animechan.io) — API pública gratuita de frases de anime.
// Límite: 5 solicitudes/hora en la capa anónima gratuita.
const BASE_URL = "https://api.animechan.io/v1/quotes/random";

async function getRandomQuote({ anime, character } = {}) {
  const params = {};
  if (anime) params.anime = String(anime).trim();
  if (character) params.character = String(character).trim();

  let data;
  try {
    const response = await axios.get(BASE_URL, {
      params,
      timeout: 15000,
      headers: {
        "User-Agent": "OrbitAPI/1.0 (https://orbit-api.onrender.com)",
        "Accept": "application/json"
      }
    });
    data = response.data;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      throw new Error("Límite de la API de frases alcanzado, intenta de nuevo más tarde");
    }
    const detail = error.response
      ? `HTTP ${error.response.status} - ${JSON.stringify(error.response.data)}`
      : error.message;
    console.error(`[animeQuotes.js] Error obteniendo frase: ${detail}`);
    throw new Error(detail);
  }

  const quote = data && data.data;
  if (!quote || !quote.content) {
    throw new Error("No se encontró ninguna frase con esos filtros");
  }

  return {
    quote: quote.content,
    anime: quote.anime ? quote.anime.name : null,
    character: quote.character ? quote.character.name : null
  };
}

module.exports = { getRandomQuote };