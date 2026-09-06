const express = require("express");
const { pinterestSearch } = require("../../../services/pinterest");

const router = express.Router();

router.get("/", async (req, res) => {
  const query = String(req.query.query || "").trim();
  const type = String(req.query.type || "").trim().toLowerCase();

  if (!query) return res.status(400).json({ status: false, creator: "Orbit", error: "El parámetro query es requerido" });
  if (query.length > 100) return res.status(400).json({ status: false, creator: "Orbit", error: "El parámetro query es demasiado largo" });

  try {
    const results = await pinterestSearch(query, type || null);
    res.json({ status: true, creator: "Orbit", query, total: results.length, results, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: false, creator: "Orbit", error: error.message });
  }
});

module.exports = router;
