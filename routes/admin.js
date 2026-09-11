const express = require("express");
const crypto = require("crypto");

const client = require("../db/client");
const { requireAdmin } = require("../middleware/auth");
const { PLAN_ORDER, planConfig } = require("../utils/plans");
const { sendMail, planActivatedEmailHtml } = require("../utils/mailer");

const router = express.Router();

router.get("/users", requireAdmin, async (req, res) => {
  const search = (req.query.search || "").trim();

  const result = search
    ? await client.execute({
        sql: `SELECT id, name, email, photo, api_key, requests_remaining, requests_limit, is_admin, vip, vip_expires_at, plan, created_at
              FROM orbit_users WHERE name LIKE ? OR email LIKE ? ORDER BY created_at DESC`,
        args: [`%${search}%`, `%${search}%`]
      })
    : await client.execute(
        `SELECT id, name, email, photo, api_key, requests_remaining, requests_limit, is_admin, vip, vip_expires_at, plan, created_at
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

router.post("/users/:id/plan", requireAdmin, async (req, res) => {
  const plan = String(req.body.plan || "").trim();

  if (!PLAN_ORDER.includes(plan) || plan === "free") {
    return res.status(400).json({ ok: false, error: "Plan invalido" });
  }

  const target = await client.execute({
    sql: "SELECT id, name, email, is_admin, referral_bonus_expires_at FROM orbit_users WHERE id = ?",
    args: [req.params.id]
  });
  if (!target.rows.length) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });

  const user = target.rows[0];
  if (Number(user.is_admin) === 1) {
    return res.status(400).json({ ok: false, error: "Los administradores ya tienen acceso completo" });
  }

  const config = planConfig(plan);
  const isVipTier = config.tierRank >= planConfig("vip").tierRank;
  const bonusActive = user.referral_bonus_expires_at && new Date(user.referral_bonus_expires_at).getTime() > Date.now();
  const effectiveLimit = config.requestsLimit + (bonusActive ? 100 : 0);

  // Los planes de Orbit API son permanentes: quedan activos hasta que un
  // admin los cambie, no vencen ni tienen fecha de renovacion.
  await client.execute({
    sql: `UPDATE orbit_users
          SET plan = ?, plan_expires_at = NULL, vip = ?, vip_expires_at = NULL,
              base_requests_limit = ?, requests_limit = ?,
              requests_remaining = CASE WHEN requests_remaining < ? THEN ? ELSE requests_remaining END
          WHERE id = ?`,
    args: [plan, isVipTier ? 1 : 0, config.requestsLimit, effectiveLimit, effectiveLimit, effectiveLimit, req.params.id]
  });

  sendMail({
    to: user.email,
    subject: `Tu plan ahora es ${config.label} — Orbit API`,
    html: planActivatedEmailHtml({
      name: user.name,
      planLabel: config.label,
      requestsLimit: config.requestsLimit,
      price: config.price
    })
  });

  res.json({ ok: true, plan });
});

router.delete("/users/:id/plan", requireAdmin, async (req, res) => {
  const target = await client.execute({ sql: "SELECT id, is_admin FROM orbit_users WHERE id = ?", args: [req.params.id] });
  if (!target.rows.length) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
  if (Number(target.rows[0].is_admin) === 1) return res.status(400).json({ ok: false, error: "No se puede cambiar el plan de un administrador" });

  const freeLimit = planConfig("free").requestsLimit;
  await client.execute({
    sql: `UPDATE orbit_users
          SET plan = 'free', plan_expires_at = NULL, vip = 0, vip_expires_at = NULL,
              base_requests_limit = ?, requests_limit = ?,
              requests_remaining = CASE WHEN requests_remaining > ? THEN ? ELSE requests_remaining END
          WHERE id = ?`,
    args: [freeLimit, freeLimit, freeLimit, freeLimit, req.params.id]
  });
  res.json({ ok: true, plan: "free" });
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
