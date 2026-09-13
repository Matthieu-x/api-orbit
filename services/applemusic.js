// services/applemusic.js
const axios = require("axios");

const DELIRIUS_BASE = "https://api.delirius.online";

async function searchAppleMusic(query) {
  const { data } = await axios.get(`${DELIRIUS_BASE}/search/applemusic`, {
    params: { query },
    timeout: 15000
  });

  if (!data || data.status !== true || !Array.isArray(data.data)) {
    throw new Error("La API externa no devolvió resultados válidos");
  }

  return data.data;
}

async function downloadAppleMusic(url) {
  const { data } = await axios.get(`${DELIRIUS_BASE}/download/applemusic`, {
    params: { url },
    timeout: 20000
  });

  if (!data || data.status !== true || !data.data) {
    throw new Error("La API externa no devolvió un resultado válido");
  }

  return data.data;
}

module.exports = { searchAppleMusic, downloadAppleMusic };
