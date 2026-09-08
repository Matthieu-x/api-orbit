const express = require("express");
const apiKeyAuth = require("../../../middleware/apiKeyAuth");
const { apiKeyAuth: createApiKeyAuth } = apiKeyAuth;
const { downloadAudio, downloadVideo } = require("../../../services/savetube");
const { downloadTiktok } = require("../../../services/tiktok");
const { searchAptoide, downloadAptoide } = require("../../../services/aptoide");
const { searchFdroid, getFdroidPackage } = require("../../../services/fdroid");

const router = express.Router();

// ─────────────────────────────────────────────
// MIDDLEWARE DE AUTENTICACIÓN
// ─────────────────────────────────────────────

// Para endpoints FREE (solo requiere API key válida)
router.use("/ytaudio", apiKeyAuth);
router.use("/tiktok", apiKeyAuth);

// Para endpoints VIP (requiere API key VIP activa)
router.use("/ytvideo", createApiKeyAuth({ vip: true }));
router.use("/aptoide", createApiKeyAuth({ vip: true }));
router.use("/fdroid", createApiKeyAuth({ vip: true }));

// ─────────────────────────────────────────────
// YOUTUBE AUDIO
// ─────────────────────────────────────────────

router.get("/ytaudio", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: "El parámetro 'url' es requerido"
    });
  }

  try {
    const result = await downloadAudio(url);
    
    if (!result.status) {
      return res.status(result.code || 500).json({
        status: false,
        creator: "Orbit",
        error: result.error
      });
    }

    return res.json({
      status: true,
      creator: "Orbit",
      ...result
    });
  } catch (error) {
    return res.status(502).json({
      status: false,
      creator: "Orbit",
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────
// YOUTUBE VIDEO
// ─────────────────────────────────────────────

router.get("/ytvideo", async (req, res) => {
  const { url, quality } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: "El parámetro 'url' es requerido"
    });
  }

  try {
    const result = await downloadVideo(url, quality || "720");
    
    if (!result.status) {
      return res.status(result.code || 500).json({
        status: false,
        creator: "Orbit",
        error: result.error
      });
    }

    return res.json({
      status: true,
      creator: "Orbit",
      ...result
    });
  } catch (error) {
    return res.status(502).json({
      status: false,
      creator: "Orbit",
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────
// TIKTOK (ejemplo si lo necesitas)
// ─────────────────────────────────────────────

router.get("/tiktok", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: "El parámetro 'url' es requerido"
    });
  }

  try {
    const result = await downloadTiktok(url);
    return res.json({
      status: true,
      creator: "Orbit",
      ...result
    });
  } catch (error) {
    return res.status(502).json({
      status: false,
      creator: "Orbit",
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────
// APTOIDE
// ─────────────────────────────────────────────

router.get("/aptoide", async (req, res) => {
  const { query, download, package: packageName } = req.query;

  if (!query && !packageName) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: "El parámetro query o package es requerido"
    });
  }

  try {
    const apps = await searchAptoide(query || packageName, req.query.limit || 10);

    if (download === "true") {
      const index = Number(req.query.index || 0);
      const selected = packageName ? apps.find(app => app.package === packageName) : apps[index];

      if (!selected || !selected.downloadUrl) {
        return res.status(404).json({
          status: false,
          creator: "Orbit",
          error: "No se encontró una descarga para la aplicación"
        });
      }

      const apk = await downloadAptoide(selected.downloadUrl);
      res.setHeader("Content-Type", "application/vnd.android.package-archive");
      res.setHeader("Content-Disposition", `attachment; filename="${String(selected.name || "app").replace(/[^a-z0-9._-]/gi, "_")}.apk"`);
      return res.send(apk);
    }

    return res.json({
      status: true,
      creator: "Orbit",
      access: "vip",
      source: "Aptoide",
      count: apps.length,
      result: apps
    });
  } catch (error) {
    return res.status(502).json({
      status: false,
      creator: "Orbit",
      error: error.message
    });
  }
});

// ─────────────────────────────────────────────
// F-DROID
// ─────────────────────────────────────────────

router.get("/fdroid", async (req, res) => {
  const { query, package: packageName, download } = req.query;

  if (!query && !packageName) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: "El parámetro query o package es requerido"
    });
  }

  try {
    if (download === "true") {
      const info = await getFdroidPackage(packageName || query);
      return res.redirect(info.downloadUrl);
    }

    if (packageName) {
      const info = await getFdroidPackage(packageName);
      return res.json({
        status: true,
        creator: "Orbit",
        access: "vip",
        source: "F-Droid",
        result: info
      });
    }

    const apps = await searchFdroid(query);
    return res.json({
      status: true,
      creator: "Orbit",
      access: "vip",
      source: "F-Droid",
      count: apps.length,
      result: apps
    });
  } catch (error) {
    return res.status(502).json({
      status: false,
      creator: "Orbit",
      error: error.message
    });
  }
});

module.exports = router;