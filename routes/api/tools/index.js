const express = require("express");
const { generateQrBuffer, generateQrDataUrl } = require("../../../services/qr");
const { getRandomAnimeImage, isValidType, VALID_TYPES } = require("../../../services/anime");

const router = express.Router();

// ─────────────────────────────────────────────
// QR CODE (generación 100% local, sin API externa)
// ─────────────────────────────────────────────

router.get("/qr", async (req, res) => {
  const text = String(req.query.text || req.query.url || "").trim();
  const format = String(req.query.format || "image").trim().toLowerCase();
  const size = req.query.size;
  const dark = req.query.dark;
  const light = req.query.light;

  if (!text) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: "El parámetro 'text' es requerido"
    });
  }

  if (text.length > 2000) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: "El parámetro 'text' es demasiado largo"
    });
  }

  try {
    const opts = { size, dark, light };

    if (format === "json" || format === "base64") {
      const dataUrl = await generateQrDataUrl(text, opts);
      return res.json({
        status: true,
        creator: "Orbit",
        text,
        result: dataUrl
      });
    }

    const buffer = await generateQrBuffer(text, opts);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", "inline; filename=\"qr.png\"");
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({
      status: false,
      creator: "Orbit",
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────
// ANIME (imagen random waifu/neko vía waifu.pics — API externa pública, solo SFW)
// ─────────────────────────────────────────────

router.get("/anime", async (req, res) => {
  const type = String(req.query.type || "waifu").trim().toLowerCase();

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
      type,
      result: url
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      creator: "Orbit",
      error: "No se pudo obtener la imagen, intenta de nuevo"
    });
  }
});

module.exports = router;