const axios = require("axios");

// Categorías SFW de nekos.best v2 (https://docs.nekos.best) — API activa y mantenida.
const VALID_TYPES = [
  "waifu", "neko", "kitsune", "husbando",
  "hug", "kiss", "pat", "cuddle", "slap", "tickle", "poke", "dance",
  "wave", "highfive", "handhold", "nom", "bite", "blush", "smile",
  "wink", "happy", "cry", "baka", "punch", "kick", "laugh", "shrug",
  "stare", "think", "pout", "nod", "bored", "feed", "smug"
];

function isValidType(type) {
  return VALID_TYPES.includes(String(type || "").toLowerCase());
}

async function getRandomAnimeImage(type) {
  const category = String(type || "neko").toLowerCase();

  try {
    const { data } = await axios.get(`https://nekos.best/api/v2/${category}`, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OrbitAPI/1.0; +https://orbit.api)",
        "Accept": "application/json"
      }
    });

    const result = data && data.results && data.results[0];

    if (!result || !result.url) {
      throw new Error("Respuesta sin campo 'url'");
    }

    return result.url;
  } catch (error) {
    const detail = error.response
      ? `HTTP ${error.response.status} - ${JSON.stringify(error.response.data)}`
      : error.message;
    console.error(`[anime.js] Error obteniendo imagen (${category}): ${detail}`);
    throw new Error(detail);
  }
}

module.exports = { getRandomAnimeImage, isValidType, VALID_TYPES };