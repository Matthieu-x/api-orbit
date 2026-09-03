const express = require("express");
const router = express.Router();
const client = require("../db/client");
const { requireAuth } = require("../middleware/auth");

router.use(requireAuth);

router.get("/me", async (req, res) => {
  try {
    const result = await client.execute({
      sql: `SELECT id, email, name, api_key, requests_today, is_admin, created_at
            FROM users WHERE id = ?`,
      args: [req.user.id]
    });
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno" });
  }
});

router.get("/notifications", async (req, res) => {
  try {
    const result = await client.execute({
      sql: `SELECT id, title, message, created_at, read
            FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      args: [req.user.id]
    });
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno" });
  }
});

router.post("/notifications/read", async (req, res) => {
  try {
    await client.execute({
      sql: "UPDATE notifications SET read = 1 WHERE user_id = ?",
      args: [req.user.id]
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno" });
  }
});

module.exports = router;
