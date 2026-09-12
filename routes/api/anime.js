const express = require("express");
const apiKeyAuth = require("../../middleware/apiKeyAuth");
const { apiKeyAuth: createApiKeyAuth } = apiKeyAuth;
const { getRandomAnimeImage, isValidType, VALID_TYPES } = require("../../services/anime");
const { search: searchAnimeHeaven, episodes: getAnimeEpisodes, videoLink: getEpisodeVideoLink } = require("../../services/animeheaven");

const router = express.Router();

// ─────────────────────────────────────────────
// MIDDLEWARE DE AUTENTICACIÓN
// ─────────────────────────────────────────────

// Para endpoints FREE (solo requiere API key válida)
router.use("/search", apiKeyAuth);

// Para endpoints Plus (random + el flujo de descarga: episodios y link de video)
router.use("/random", createApiKeyAuth({ minPlan: "plus" }));
router.use("/episodes", createApiKeyAuth({ minPlan: "plus" }));
router.use("/download", createApiKeyAuth({ minPlan: "plus" }));

// ─────────────────────────────────────────────
// ANIME RANDOM (waifu/neko vía nekos.best — API externa pública, solo SFW)
// ─────────────────────────────────────────────

router.get("/random", async (req, res) => {
  const type = String(req.query.type || "neko").trim().toLowerCase();

  if (!isValidType(type)) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: `Categoría inválida. Usa una de: ${VALID_TYPES.join(", ")}`
    });
  }

  try {
    const url = await getRandomAnimeImage(type);
    return res.json({
      status: true,
      creator: "Orbit",
      access: req.endpointMinPlan,
      type,
      result: url
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      creator: "Orbit",
      error: "No se pudo obtener la imagen, intenta de nuevo",
      detail: error.message
    });
  }
});

// ─────────────────────────────────────────────
// ANIME SEARCH (vía liyanaarachchi-animeheavenme) — FREE
// Paso 1 del flujo: buscar un anime por nombre.
// ─────────────────────────────────────────────

router.get("/search", async (req, res) => {
  const query = String(req.query.query || req.query.q || "").trim();

  if (!query) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: "El parámetro 'query' es requerido"
    });
  }

  try {
    const result = await searchAnimeHeaven(query);
    return res.json({
      status: true,
      creator: "Orbit",
      access: "free",
      query,
      result
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      creator: "Orbit",
      error: "No se pudo buscar el anime, intenta de nuevo",
      detail: error.message
    });
  }
});

// ─────────────────────────────────────────────
// ANIME EPISODES (vía liyanaarachchi-animeheavenme) — PLUS o superior
// Paso 2 del flujo: dado un resultado de /search, listar sus episodios.
// ─────────────────────────────────────────────

router.get("/episodes", async (req, res) => {
  const link = String(req.query.link || req.query.id || req.query.url || "").trim();

  if (!link) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: "El parámetro 'link' (el campo 'link' que devuelve /anime/search) es requerido"
    });
  }

  try {
    const result = await getAnimeEpisodes(link);
    return res.json({
      status: true,
      creator: "Orbit",
      access: req.endpointMinPlan,
      link,
      result
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      creator: "Orbit",
      error: "No se pudieron obtener los episodios, intenta de nuevo",
      detail: error.message
    });
  }
});

// ─────────────────────────────────────────────
// ANIME DOWNLOAD (link de video, vía liyanaarachchi-animeheavenme) — PLUS o superior
// Paso 3 del flujo: dado un episodio de /episodes, obtener el link del video.
// ─────────────────────────────────────────────

router.get("/download", async (req, res) => {
  const episode = String(req.query.episode || req.query.id || req.query.url || "").trim();

  if (!episode) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: "El parámetro 'episode' (tomado de /anime/episodes) es requerido"
    });
  }

  try {
    const result = await getEpisodeVideoLink(episode);
    return res.json({
      status: true,
      creator: "Orbit",
      access: req.endpointMinPlan,
      episode,
      result
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      creator: "Orbit",
      error: "No se pudo obtener el link del video, intenta de nuevo",
      detail: error.message
    });
  }
});

module.exports = router;
