const express = require("express");
const { searchTikTok } = require("../../../services/tiktokSearch");

const router = express.Router();

router.get("/", async (req, res) => {
  const query = String(req.query.query || "").trim();
  const limit = Math.min(Number(req.query.limit) || 10, 30);

  if (!query) return res.status(400).json({ status: false, creator: "Orbit", error: "El parámetro query es requerido" });
  if (query.length > 100) return res.status(400).json({ status: false, creator: "Orbit", error: "El parámetro query es demasiado largo" });

  try {
    const results = await searchTikTok(query, limit);
    res.json({ status: true, creator: "Orbit", query, total: results.length, results, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: false, creator: "Orbit", error: error.message });
  }
});

module.exports = router;
           
