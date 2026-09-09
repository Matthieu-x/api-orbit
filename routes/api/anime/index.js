const express = require("express");
const { getRandomAnimeImage, isValidType, VALID_TYPES } = require("../../../services/anime");

const router = express.Router();

// ─────────────────────────────────────────────
// ANIME RANDOM (waifu/neko vía nekos.best — API externa pública, solo SFW)
// Categoría VIP
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
      access: "vip",
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

module.exports = router;