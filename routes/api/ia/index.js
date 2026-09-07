const express = require("express");
const { askOrbitIa } = require("../../../services/orbitia");

const router = express.Router();

router.get("/", async (req, res) => {
  const { text, promptSystem } = req.query;
  if (!text) return res.status(400).json({ status: false, creator: "Orbit", error: "El parámetro text es requerido" });

  try {
    const result = await askOrbitIa(text, { systemPrompt: promptSystem });
    if (!result.status) return res.status(500).json({ status: false, creator: "Orbit", error: result.error });
    res.json({ status: true, creator: "Orbit", access: "vip", data: { response: result.response }, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: false, creator: "Orbit", error: error.message });
  }
});

module.exports = router;