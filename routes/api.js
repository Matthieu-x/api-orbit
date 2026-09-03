const express = require("express");
const apiKeyAuth = require("../middleware/apiKeyAuth");

const router = express.Router();

router.get("/consulta", apiKeyAuth, (req, res) => {
  const texto = req.query.texto || "";

  res.json({
    ok: true,
    endpoint: "consulta",
    solicitado_por: req.apiUser.name,
    resultado: {
      original: texto,
      mayusculas: texto.toUpperCase(),
      longitud: texto.length
    },
    solicitudes_restantes: req.apiUser.requests_remaining
  });
});

module.exports = router;
