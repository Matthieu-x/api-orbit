const axios = require("axios");

// Solo categorías SFW de waifu.pics (https://waifu.pics/docs) — nunca NSFW.
const VALID_TYPES = [
  "waifu", "neko", "shinobu", "megumin", "bully", "cuddle", "cry", "hug",
  "awoo", "kiss", "lick", "pat", "smug", "bonk", "yeet", "blush", "smile",
  "wave", "highfive", "handhold", "nom", "bite", "glomp", "slap", "kill",
  "kick", "happy", "wink", "poke", "dance", "cringe"
];

function isValidType(type) {
  return VALID_TYPES.includes(String(type || "").toLowerCase());
}

async function getRandomAnimeImage(type) {
  const category = String(type || "waifu").toLowerCase();

  try {
    const { data } = await axios.get(`https://api.waifu.pics/sfw/${category}`, {
      timeout: 15000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; OrbitAPI/1.0; +https://orbit.api)",
        "Accept": "application/json"
      }
    });

    if (!data || !data.url) {
      throw new Error("Respuesta sin campo 'url'");
    }

    return data.url;
  } catch (error) {
    const detail = error.response
      ? `HTTP ${error.response.status} - ${JSON.stringify(error.response.data)}`
      : error.message;
    console.error(`[anime.js] Error obteniendo imagen (${category}): ${detail}`);
    throw new Error(detail);
  }
}

module.exports = { getRandomAnimeImage, isValidType, VALID_TYPES };