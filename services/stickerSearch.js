// services/stickerSearch.js
const axios = require("axios");

// Key de Giphy del usuario (repo privado -> hardcodeada). Se puede
// sobreescribir con GIPHY_API_KEY si se prefiere no tenerla en el código.
const GIPHY_API_KEY = process.env.GIPHY_API_KEY || "ihq4sq9y3dSCAn94g5wuVUdCBIXQZPbz";
const GIPHY_STICKERS_URL = "https://api.giphy.com/v1/stickers/search";

/**
 * Busca stickers ya hechos por palabra clave usando el catálogo de
 * stickers de Giphy (animados, fondo transparente).
 */
async function searchStickers(query, limit = 20) {
  const response = await axios.get(GIPHY_STICKERS_URL, {
    params: { q: query, api_key: GIPHY_API_KEY, limit, rating: "pg-13" },
    timeout: 15000
  });

  const list = Array.isArray(response.data?.data) ? response.data.data : [];

  return list.map((item) => ({
    id: item.id,
    title: item.title || null,
    image: item.images?.fixed_width?.url || item.images?.original?.url || null
  }));
}

module.exports = { searchStickers };
