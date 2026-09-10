const express = require("express");
const { searchStickers } = require("../../services/stickerSearch");

const router = express.Router();

router.get("/", async (req, res) => {
  const query = String(req.query.query || req.query.q || "").trim();
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

  if (!query) {
    return res.status(400).json({
      status: false,
      creator: "Orbit",
      error: "El parámetro 'query' es requerido"
    });
  }

  try {
    const results = await searchStickers(query, limit);
    res.json({
      status: true,
      creator: "Orbit",
      query,
      total: results.length,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      creator: "Orbit",
      error: error.response?.data?.message || error.message
    });
  }
});

module.exports = router;
