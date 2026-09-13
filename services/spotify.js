const axios = require("axios");

const DELIRIUS_BASE = "https://api.delirius.online";

async function searchSpotify(query, limit) {
  const { data } = await axios.get(`${DELIRIUS_BASE}/search/spotify`, {
    params: { q: query, limit },
    timeout: 15000
  });

  if (!data || data.status !== true || !Array.isArray(data.data)) {
    throw new Error("La API externa no devolvió resultados válidos");
  }

  return data.data;
}

async function downloadSpotify(url) {
  const { data } = await axios.get(`${DELIRIUS_BASE}/download/spotifydl`, {
    params: { url },
    timeout: 20000
  });

  if (!data || data.status !== true || !data.data) {
    throw new Error("La API externa no devolvió un resultado válido");
  }

  return data.data;
}

module.exports = { searchSpotify, downloadSpotify };
