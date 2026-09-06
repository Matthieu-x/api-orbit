const express = require("express");
const apiKeyAuth = require("../../../middleware/apiKeyAuth");
const { apiKeyAuth: createApiKeyAuth } = apiKeyAuth;
const { downloadAudio, downloadVideo } = require("../../../services/savetube");

const router = express.Router();

router.use("/ytaudio", apiKeyAuth);
router.use("/ytvideo", createApiKeyAuth({ vip: true }));

const QUALITY = ["144", "240", "360", "480", "720", "1080"];

router.get("/ytaudio", async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ status: false, creator: "Orbit", error: "El parámetro url es requerido", message: "Usa ?url=YOUTUBE_URL" });
  }
  try {
    const audio = await downloadAudio(url);
    if (!audio.status) return res.status(audio.code || 500).json({ status: false, creator: "Orbit", error: audio.error });
    if (req.query.download === "true") return res.redirect(audio.download_url);
    res.json({
      status: true,
      creator: "Orbit",
      access: "free",
      result: {
        title: audio.title,
        duration: audio.duration,
        thumbnail: audio.thumbnail,
        format: audio.format,
        download_url: audio.download_url,
        api_download: `${req.baseUrl}/ytaudio?url=${encodeURIComponent(url)}&download=true`
      }
    });
  } catch (error) {
    res.status(500).json({ status: false, creator: "Orbit", error: error.message });
  }
});

router.get("/ytvideo", async (req, res) => {
  const { url, quality = "360" } = req.query;
  if (!url) return res.status(400).json({ status: false, creator: "Orbit", error: "El parámetro url es requerido" });
  if (!QUALITY.includes(String(quality))) return res.status(400).json({ status: false, creator: "Orbit", error: `Calidad no válida. Usa: ${QUALITY.join(", ")}` });

  try {
    const video = await downloadVideo(url, String(quality));
    if (!video.status) return res.status(video.code || 500).json({ status: false, creator: "Orbit", error: video.error });
    if (req.query.download === "true") return res.redirect(video.download_url);
    res.json({
      status: true,
      creator: "Orbit",
      access: "vip",
      result: video,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: false, creator: "Orbit", error: error.message });
  }
});

module.exports = router;
