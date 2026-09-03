const express = require("express");
const crypto = require("crypto");
require("dotenv").config();

const client = require("../db/client");
const { generateApiKey, todayStamp } = require("../utils/keygen");
const { verifyCaptcha } = require("../utils/captcha");
const { createSession, destroySession, SESSION_DAYS } = require("../utils/session");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const COOKIE_OPTS = {
  httpOnly: true,
  maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  sameSite: "lax"
};

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    photo: user.photo,
    api_key: user.api_key,
    requests_remaining: user.requests_remaining,
    requests_limit: user.requests_limit,
    is_admin: Number(user.is_admin) === 1
  };
}

router.post("/register", async (req, res) => {
  const { name, email, password, captchaToken } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ ok: false, error: "Completa todos los campos" });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ ok: false, error: "La contrasena debe tener al menos 6 caracteres" });
  }

  const captchaOk = await verifyCaptcha(captchaToken);
  if (!captchaOk) {
    return res.status(400).json({ ok: false, error: "Verificacion de captcha fallida" });
  }

  const existing = await client.execute({
    sql: "SELECT id FROM users WHERE email = ?",
    args: [email]
  });

  if (existing.rows.length > 0) {
    return res.status(409).json({ ok: false, error: "Ese correo ya esta registrado" });
  }

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    password,
    api_key: generateApiKey(),
    requests_remaining: 100,
    requests_limit: 100,
    requests_reset_date: todayStamp(),
    created_at: new Date().toISOString()
  };

  await client.execute({
    sql: `INSERT INTO users
      (id, name, email, password, photo, api_key, requests_remaining, requests_limit, requests_reset_date, is_admin, created_at)
      VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, 0, ?)`,
    args: [
      user.id,
      user.name,
      user.email,
      user.password,
      user.api_key,
      user.requests_remaining,
      user.requests_limit,
      user.requests_reset_date,
      user.created_at
    ]
  });

  const session = await createSession(user.id);
  res.cookie("orbit_session", session.token, COOKIE_OPTS);
  res.json({ ok: true, user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "Completa todos los campos" });
  }

  const result = await client.execute({
    sql: "SELECT * FROM users WHERE email = ?",
    args: [email]
  });

  const user = result.rows[0];

  if (!user || user.password !== password) {
    return res.status(401).json({ ok: false, error: "Correo o contrasena incorrectos" });
  }

  const session = await createSession(user.id);
  res.cookie("orbit_session", session.token, COOKIE_OPTS);
  res.json({ ok: true, user: publicUser(user) });
});

router.post("/logout", async (req, res) => {
  await destroySession(req.cookies.orbit_session);
  res.clearCookie("orbit_session");
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ ok: true, user: publicUser(req.user) });
});

router.get("/config", (req, res) => {
  res.json({ ok: true, hcaptchaSitekey: process.env.HCAPTCHA_SITEKEY });
});

module.exports = router;
