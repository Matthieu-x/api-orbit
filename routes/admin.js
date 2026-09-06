const express = require("express");
const crypto = require("crypto");

const client = require("../db/client");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/users", requireAdmin, async (req, res) => {
  const search = (req.query.search || "").trim();

  const result = search
    ? await client.execute({
        sql: `SELECT id, name, email, photo, api_key, requests_remaining, requests_limit, is_admin, vip, vip_expires_at, created_at
              FROM orbit_users WHERE name LIKE ? OR email LIKE ? ORDER BY created_at DESC`,
        args: [`%${search}%`, `%${search}%`]
      })
    : await client.execute(
        `SELECT id, name, email, photo, api_key, requests_remaining, requests_limit, is_admin, vip, vip_expires_at, created_at
         FROM orbit_users ORDER BY created_at DESC`
      );

  res.json({ ok: true, users: result.rows });
});

router.delete("/users/:id", requireAdmin, async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ ok: false, error: "No puedes eliminar tu propia cuenta" });
  }

  await client.execute({ sql: "DELETE FROM orbit_sessions WHERE user_id = ?", args: [req.params.id] });
  await client.execute({ sql: "DELETE FROM orbit_users WHERE id = ?", args: [req.params.id] });

  res.json({ ok: true });
});

router.post("/users/:id/add-requests", requireAdmin, async (req, res) => {
  const amount = Number(req.body.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ ok: false, error: "Ingresa una cantidad valida" });
  }

  await client.execute({
    sql: "UPDATE orbit_users SET requests_remaining = requests_remaining + ? WHERE id = ?",
    args: [amount, req.params.id]
  });

  res.json({ ok: true });
});

router.post("/users/:id/vip", requireAdmin, async (req, res) => {
  const days = Number(req.body.days);
  if (!Number.isInteger(days) || days < 1 || days > 3650) {
    return res.status(400).json({ ok: false, error: "Los dias VIP deben estar entre 1 y 3650" });
  }

  const target = await client.execute({ sql: "SELECT id, is_admin, vip, vip_expires_at FROM orbit_users WHERE id = ?", args: [req.params.id] });
  if (!target.rows.length) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });

  const user = target.rows[0];
  if (Number(user.is_admin) === 1) {
    return res.status(400).json({ ok: false, error: "Los administradores ya tienen acceso VIP" });
  }

  const now = new Date();
  const currentExpiry = user.vip_expires_at ? new Date(user.vip_expires_at) : null;
  const base = currentExpiry && currentExpiry.getTime() > now.getTime() ? currentExpiry : now;
  const expires = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  await client.execute({
    sql: "UPDATE orbit_users SET vip = 1, vip_expires_at = ?, requests_limit = 1000, requests_remaining = CASE WHEN requests_remaining < 1000 THEN 1000 ELSE requests_remaining END WHERE id = ?",
    args: [expires.toISOString(), req.params.id]
  });

  res.json({ ok: true, vip: true, vip_expires_at: expires.toISOString() });
});

router.delete("/users/:id/vip", requireAdmin, async (req, res) => {
  const target = await client.execute({ sql: "SELECT id, is_admin FROM orbit_users WHERE id = ?", args: [req.params.id] });
  if (!target.rows.length) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
  if (Number(target.rows[0].is_admin) === 1) return res.status(400).json({ ok: false, error: "No se puede quitar el acceso VIP de un administrador" });

  await client.execute({
    sql: "UPDATE orbit_users SET vip = 0, vip_expires_at = NULL, requests_limit = 100, requests_remaining = CASE WHEN requests_remaining > 100 THEN 100 ELSE requests_remaining END WHERE id = ?",
    args: [req.params.id]
  });
  res.json({ ok: true, vip: false });
});

router.post("/notifications", requireAdmin, async (req, res) => {
  const { title, message, userId } = req.body;

  if (!title || !message) {
    return res.status(400).json({ ok: false, error: "Completa titulo y mensaje" });
  }

  await client.execute({
    sql: `INSERT INTO orbit_notifications (id, user_id, title, message, created_at, read)
          VALUES (?, ?, ?, ?, ?, 0)`,
    args: [crypto.randomUUID(), userId || null, title, message, new Date().toISOString()]
  });

  res.json({ ok: true });
});

module.exports = router;
