const express = require("express");
const crypto = require("crypto");
require("dotenv").config();

const client = require("../db/client");
const { generateApiKey, generateVerificationCode, todayStamp } = require("../utils/keygen");
const { verifyCaptcha } = require("../utils/captcha");
const { createSession, destroySession, SESSION_DAYS } = require("../utils/session");
const { requireAuth } = require("../middleware/auth");
const { generateOrbitIp } = require("../utils/ip");
const { sendMail, welcomeEmailHtml, verificationEmailHtml } = require("../utils/mailer");

const VERIFICATION_TTL_MS = 15 * 60 * 1000;

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
    is_admin: Number(user.is_admin) === 1,
    is_vip: Number(user.vip) === 1 && (!user.vip_expires_at || new Date(user.vip_expires_at).getTime() > Date.now()),
    vip_expires_at: user.vip_expires_at || null,
    orbit_ip: user.orbit_ip_token || null
  };
}

// Orbit IP es una credencial secundaria con formato de IPv4 privada.
// No depende de la IP real del dispositivo ni cambia al iniciar sesion.

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
    sql: "SELECT id FROM orbit_users WHERE email = ?",
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
    created_at: new Date().toISOString(),
    orbit_ip_token: generateOrbitIp(),
    verification_code: generateVerificationCode(),
    verification_expires_at: new Date(Date.now() + VERIFICATION_TTL_MS).toISOString()
  };

  await client.execute({
    sql: `INSERT INTO orbit_users
      (id, name, email, password, photo, api_key, requests_remaining, requests_limit, requests_reset_date, is_admin, created_at, vip, vip_expires_at, allowed_ips, orbit_ip_token, email_verified, verification_code, verification_expires_at)
      VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, 0, ?, 0, NULL, NULL, ?, 0, ?, ?)`,
    args: [
      user.id,
      user.name,
      user.email,
      user.password,
      user.api_key,
      user.requests_remaining,
      user.requests_limit,
      user.requests_reset_date,
      user.created_at,
      user.orbit_ip_token,
      user.verification_code,
      user.verification_expires_at
    ]
  });

  res.json({ ok: true, email: user.email, message: "Cuenta creada. Revisa tu correo para verificarla." });

  // Envío del código de verificación en segundo plano: si SendLib falla
  // no debe afectar la respuesta de registro (ya enviada arriba).
  sendMail({
    to: user.email,
    subject: "Tu código de verificación — Orbit API",
    html: verificationEmailHtml({ name: user.name, code: user.verification_code })
  });
});

router.post("/verify", async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ ok: false, error: "Completa todos los campos" });
  }

  const result = await client.execute({
    sql: "SELECT * FROM orbit_users WHERE email = ?",
    args: [email]
  });

  const user = result.rows[0];

  if (!user) {
    return res.status(404).json({ ok: false, error: "No existe una cuenta con ese correo" });
  }

  if (Number(user.email_verified) === 1) {
    return res.status(409).json({ ok: false, error: "Esta cuenta ya está verificada" });
  }

  if (!user.verification_code || user.verification_code !== code) {
    return res.status(400).json({ ok: false, error: "Código incorrecto" });
  }

  if (!user.verification_expires_at || new Date(user.verification_expires_at).getTime() < Date.now()) {
    return res.status(400).json({ ok: false, error: "El código expiró, solicita uno nuevo" });
  }

  await client.execute({
    sql: "UPDATE orbit_users SET email_verified = 1, verification_code = NULL, verification_expires_at = NULL WHERE id = ?",
    args: [user.id]
  });

  const session = await createSession(user.id);
  res.cookie("orbit_session", session.token, COOKIE_OPTS);
  res.json({ ok: true, user: publicUser({ ...user, email_verified: 1 }) });

  // Bienvenida en segundo plano, ya con correo, IP orbit y api key.
  sendMail({
    to: user.email,
    subject: "¡Cuenta verificada! Bienvenido a Orbit API",
    html: welcomeEmailHtml({ name: user.name, apiKey: user.api_key })
  });
});

router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ ok: false, error: "Completa todos los campos" });
  }

  const result = await client.execute({
    sql: "SELECT * FROM orbit_users WHERE email = ?",
    args: [email]
  });

  const user = result.rows[0];

  if (!user) {
    return res.status(404).json({ ok: false, error: "No existe una cuenta con ese correo" });
  }

  if (Number(user.email_verified) === 1) {
    return res.status(409).json({ ok: false, error: "Esta cuenta ya está verificada" });
  }

  const newCode = generateVerificationCode();
  const newExpiry = new Date(Date.now() + VERIFICATION_TTL_MS).toISOString();

  await client.execute({
    sql: "UPDATE orbit_users SET verification_code = ?, verification_expires_at = ? WHERE id = ?",
    args: [newCode, newExpiry, user.id]
  });

  res.json({ ok: true, message: "Código reenviado" });

  sendMail({
    to: user.email,
    subject: "Tu código de verificación — Orbit API",
    html: verificationEmailHtml({ name: user.name, code: newCode })
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "Completa todos los campos" });
  }

  const result = await client.execute({
    sql: "SELECT * FROM orbit_users WHERE email = ?",
    args: [email]
  });

  const user = result.rows[0];

  if (!user || user.password !== password) {
    return res.status(401).json({ ok: false, error: "Correo o contrasena incorrectos" });
  }

  if (Number(user.email_verified) !== 1) {
    return res.status(403).json({ ok: false, error: "Verifica tu correo antes de iniciar sesión", needs_verification: true, email: user.email });
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
