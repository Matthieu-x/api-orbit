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

  const { data } = await axios.get(`https://api.waifu.pics/sfw/${category}`, {
    timeout: 10000
  });

  if (!data || !data.url) {
    throw new Error("No se pudo obtener una imagen en este momento");
  }

  return data.url;
}

module.exports = { getRandomAnimeImage, isValidType, VALID_TYPES };