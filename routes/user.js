const express = require("express");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const client = require("../db/client");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "public", "uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${req.user.id}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("El archivo debe ser una imagen"));
    }
    cb(null, true);
  }
});

router.put("/profile", requireAuth, async (req, res) => {
  const { name } = req.body;

  if (!name || String(name).trim().length < 2) {
    return res.status(400).json({ ok: false, error: "Ingresa un nombre valido" });
  }

  await client.execute({
    sql: "UPDATE orbit_users SET name = ? WHERE id = ?",
    args: [String(name).trim(), req.user.id]
  });

  res.json({ ok: true, name: String(name).trim() });
});

router.post("/profile/photo", requireAuth, (req, res) => {
  upload.single("photo")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ ok: false, error: "No se recibio ninguna imagen" });
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    await client.execute({
      sql: "UPDATE orbit_users SET photo = ? WHERE id = ?",
      args: [photoUrl, req.user.id]
    });

    res.json({ ok: true, photo: photoUrl });
  });
});

router.get("/notifications", requireAuth, async (req, res) => {
  const result = await client.execute({
    sql: `SELECT * FROM orbit_notifications
          WHERE user_id = ? OR user_id IS NULL
          ORDER BY created_at DESC LIMIT 30`,
    args: [req.user.id]
  });

  res.json({ ok: true, notifications: result.rows });
});

router.post("/notifications/:id/read", requireAuth, async (req, res) => {
  await client.execute({
    sql: "UPDATE orbit_notifications SET read = 1 WHERE id = ?",
    args: [req.params.id]
  });

  res.json({ ok: true });
});

module.exports = router;
