+const express = require("express");
const { askOrbitIa } = require("../../../services/orbitia");

const router = express.Router();

router.get("/", async (req, res) => {
  const { text, promptSystem } = req.query;
  if (!text) return res.status(400).json({ status: false, creator: "Orbit", error: "El parámetro text es requerido" });

  // Nota: el backend actual (Delirius chatgpt) no admite un prompt de
  // sistema personalizado, así que 'promptSystem' ya no tiene efecto.
  // Se mantiene aceptado en la query solo para no romper a quien ya lo mandaba.
  void promptSystem;

  try {
    const result = await askOrbitIa(text);
    if (!result.status) return res.status(500).json({ status: false, creator: "Orbit", error: result.error });
    res.json({ status: true, creator: "Orbit", access: req.endpointMinPlan, data: { response: result.response }, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: false, creator: "Orbit", error: error.message });
  }
});

module.exports = router;