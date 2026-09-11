const express = require("express");
const apiKeyAuth = require("../../../middleware/apiKeyAuth");
const { generateQrBuffer, generateQrDataUrl } = require("../../../services/qr");
const { generatePassword, parseBool } = require("../../../services/password");
const { translateText } = require("../../../services/translate");
const { base64Process } = require("../../../services/encode");
const { hashText, hashAll } = require("../../../services/hash");
const { generateUuids } = require("../../../services/uuid");

const router = express.Router();

// ─────────────────────────────────────────────
// MIDDLEWARE DE AUTENTICACIÓN
// ─────────────────────────────────────────────

// Para endpoints FREE (solo requiere API key válida)
router.use("/qr", apiKeyAuth);
router.use("/password", apiKeyAuth);
router.use("/translate", apiKeyAuth);
router.use("/base64", apiKeyAuth);
router.use("/hash", apiKeyAuth);
router.use("/uuid", apiKeyAuth);

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

// ─────────────────────────────────────────────
// TRANSLATE (Google Translate público, sin API key propia)
// ─────────────────────────────────────────────

router.get("/translate", async (req, res) => {
  const text = String(req.query.text || req.query.texto || "").trim();
  const to = String(req.query.to || req.query.destino || "es").trim();
  const from = String(req.query.from || req.query.origen || "auto").trim();

  if (!text) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: "El parámetro 'text' es requerido"
    });
  }

  if (text.length > 3000) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: "El parámetro 'text' es demasiado largo (máximo 3000 caracteres)"
    });
  }

  try {
    const result = await translateText(text, to, from);
    return res.json({
      status: true,
      creator: "Orbit",
      text,
      from: result.from,
      to: result.to,
      result: result.translated
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────
// BASE64 (encode/decode 100% local, sin API externa)
// ─────────────────────────────────────────────

router.get("/base64", (req, res) => {
  const text = String(req.query.text || "").trim();
  const action = String(req.query.action || "encode").trim().toLowerCase();

  if (!text) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: "El parámetro 'text' es requerido"
    });
  }

  if (!["encode", "decode"].includes(action)) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: "El parámetro 'action' debe ser 'encode' o 'decode'"
    });
  }

  try {
    const result = base64Process(text, action);
    return res.json({
      status: true,
      creator: "Orbit",
      action,
      text,
      result
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────
// HASH (MD5/SHA1/SHA256/SHA512, 100% local, sin API externa)
// ─────────────────────────────────────────────

router.get("/hash", (req, res) => {
  const text = String(req.query.text || "").trim();
  const algorithm = req.query.algorithm ? String(req.query.algorithm).trim().toLowerCase() : null;

  if (!text) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: "El parámetro 'text' es requerido"
    });
  }

  try {
    if (algorithm) {
      const result = hashText(text, algorithm);
      return res.json({
        status: true,
        creator: "Orbit",
        algorithm,
        text,
        result
      });
    }

    const result = hashAll(text);
    return res.json({
      status: true,
      creator: "Orbit",
      text,
      result
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────
// UUID (generación 100% local, sin API externa)
// ─────────────────────────────────────────────

router.get("/uuid", (req, res) => {
  try {
    const results = generateUuids(req.query.count);
    return res.json({
      status: true,
      creator: "Orbit",
      total: results.length,
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