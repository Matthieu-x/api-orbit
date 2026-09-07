const aptoide = require("aptoide-api");

async function searchAptoide(query, limit = 10) {
  if (!query) {
    throw new Error("El parámetro query es requerido");
  }

  const results = await aptoide.search(
    String(query),
    Math.min(Math.max(Number(limit) || 10, 1), 20)
  );

  return Array.isArray(results) ? results : [];
}

async function downloadAptoide(url) {
  if (!url) {
    throw new Error("URL de descarga no disponible");
  }

  return aptoide.download(url);
}

module.exports = {
  searchAptoide,
  downloadAptoide
};