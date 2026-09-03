const express = require("express");
const crypto = require("crypto");

const client = require("../db/client");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/users", requireAdmin, async (req, res) => {
  const search = (req.query.search || "").trim();

  const result = search
    ? await client.execute({
        sql: `SELECT id, name, email, password, photo, api_key, requests_remaining, requests_limit, is_admin, created_at
              FROM users WHERE name LIKE ? OR email LIKE ? ORDER BY created_at DESC`,
        args: [`%${search}%`, `%${search}%`]
      })
    : await client.execute(
        `SELECT id, name, email, password, photo, api_key, requests_remaining, requests_limit, is_admin, created_at
         FROM users ORDER BY created_at DESC`
      );

  res.json({ ok: true, users: result.rows });
});

router.delete("/users/:id", requireAdmin, async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ ok: false, error: "No puedes eliminar tu propia cuenta" });
  }

  await client.execute({ sql: "DELETE FROM sessions WHERE user_id = ?", args: [req.params.id] });
  await client.execute({ sql: "DELETE FROM users WHERE id = ?", args: [req.params.id] });

  res.json({ ok: true });
});

router.post("/users/:id/add-requests", requireAdmin, async (req, res) => {
  const amount = Number(req.body.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ ok: false, error: "Ingresa una cantidad valida" });
  }

  await client.execute({
    sql: "UPDATE users SET requests_remaining = requests_remaining + ? WHERE id = ?",
    args: [amount, req.params.id]
  });

  res.json({ ok: true });
});

router.post("/notifications", requireAdmin, async (req, res) => {
  const { title, message, userId } = req.body;

  if (!title || !message) {
    return res.status(400).json({ ok: false, error: "Completa titulo y mensaje" });
  }

  await client.execute({
    sql: `INSERT INTO notifications (id, user_id, title, message, created_at, read)
          VALUES (?, ?, ?, ?, ?, 0)`,
    args: [crypto.randomUUID(), userId || null, title, message, new Date().toISOString()]
  });

  res.json({ ok: true });
});

module.exports = router;
