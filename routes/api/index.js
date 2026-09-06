const express = require("express");
const apiKeyAuth = require("../../middleware/apiKeyAuth");
const searchRoutes = require("./search");
const downloadRoutes = require("./download");
const pinterestRoutes = require("./pinterest");

const router = express.Router();

router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

router.use("/busqueda", apiKeyAuth, searchRoutes);
router.use("/search", apiKeyAuth, searchRoutes);
router.use("/download", downloadRoutes);
router.use("/pinterest", apiKeyAuth, pinterestRoutes);

module.exports = router;
