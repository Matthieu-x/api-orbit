const express = require("express");
const apiKeyAuth = require("../../../middleware/apiKeyAuth");
const { generateQrBuffer, generateQrDataUrl } = require("../../../services/qr");
const { generatePassword, parseBool } = require("../../../services/password");

const router = express.Router();

// ─────────────────────────────────────────────
// MIDDLEWARE DE AUTENTICACIÓN
// ─────────────────────────────────────────────

// Para endpoints FREE (solo requiere API key válida)
router.use("/qr", apiKeyAuth);
router.use("/password", apiKeyAuth);

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
// PASSWORD (generacion 100% local con crypto nativo, sin API externa)
// ─────────────────────────────────────────────

router.get("/password", (req, res) => {
  const length = Math.min(Math.max(Number(req.query.length) || 16, 6), 64);
  const count = Math.min(Math.max(Number(req.query.count) || 1, 1), 10);

  const opts = {
    length,
    lowercase: parseBool(req.query.lowercase, true),
    uppercase: parseBool(req.query.uppercase, true),
    numbers: parseBool(req.query.numbers, true),
    symbols: parseBool(req.query.symbols, true)
  };

  try {
    const results = Array.from({ length: count }, () => generatePassword(opts));
    return res.json({
      status: true,
      creator: "Orbit",
      length,
      result: results[0],
      results
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: error.message
    });
  }
});

module.exports = router;