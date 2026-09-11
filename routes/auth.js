const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
require("dotenv").config();

const client = require("../db/client");
const { generateApiKey, generateVerificationCode, todayStamp } = require("../utils/keygen");
const { verifyCaptcha } = require("../utils/captcha");
const { createSession, destroySession, SESSION_DAYS } = require("../utils/session");
const { requireAuth } = require("../middleware/auth");
const { generateOrbitIp } = require("../utils/ip");
const { sendMail, welcomeEmailHtml, verificationEmailHtml, resetPasswordEmailHtml } = require("../utils/mailer");
const {
  REFERRAL_BONUS_REQUESTS,
  REFERRAL_BONUS_DAYS,
  generateUniqueReferralCode,
  isReferralBonusActive,
  grantReferralBonus
} = require("../utils/referral");
const { PLANS, planConfig } = require("../utils/plans");

const VERIFICATION_TTL_MS = 15 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;

// Credenciales de la OAuth App de GitHub (repo privado -> hardcodeadas).
// Se pueden sobreescribir con variables de entorno si se prefiere.
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "Ov23liiKanDD3H4gC8y6";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "cfa77b928f5937c48026d539e0e0bdf30369182a";

const router = express.Router();

const COOKIE_OPTS = {
  httpOnly: true,
  maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  sameSite: "lax"
};

function publicUser(user) {
  const plan = Number(user.is_admin) === 1 ? "superorbit" : PLANS[user.plan] ? user.plan : "free";
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
    plan,
    plan_label: planConfig(plan).label,
    orbit_ip: user.orbit_ip_token || null,
    referral_code: user.referral_code || null,
    referral_bonus_active: isReferralBonusActive(user),
    referral_bonus_expires_at: user.referral_bonus_expires_at || null,
    created_at: user.created_at || null
  };
}

// Orbit IP es una credencial secundaria con formato de IPv4 privada.
// No depende de la IP real del dispositivo ni cambia al iniciar sesion.

router.post("/register", async (req, res) => {
  const { name, email, password, captchaToken, ref } = req.body;

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

  // Codigo de invitacion: opcional. Si viene y coincide con un usuario
  // existente, tanto el nuevo usuario como quien invito ganan +100
  // solicitudes/dia por 7 dias.
  let referrer = null;
  const refCode = String(ref || "").trim();
  if (refCode) {
    const referrerResult = await client.execute({
      sql: "SELECT * FROM orbit_users WHERE referral_code = ?",
      args: [refCode]
    });
    referrer = referrerResult.rows[0] || null;
  }

  const referralCode = await generateUniqueReferralCode(name);
  const baseLimit = 100;
  const bonusExpiresAt = referrer ? new Date(Date.now() + REFERRAL_BONUS_DAYS * 24 * 60 * 60 * 1000).toISOString() : null;
  const startingLimit = referrer ? baseLimit + REFERRAL_BONUS_REQUESTS : baseLimit;

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    password,
    api_key: generateApiKey(),
    requests_remaining: startingLimit,
    requests_limit: startingLimit,
    requests_reset_date: todayStamp(),
    created_at: new Date().toISOString(),
    orbit_ip_token: generateOrbitIp(),
    verification_code: generateVerificationCode(),
    verification_expires_at: new Date(Date.now() + VERIFICATION_TTL_MS).toISOString()
  };

  await client.execute({
    sql: `INSERT INTO orbit_users
      (id, name, email, password, photo, api_key, requests_remaining, requests_limit, requests_reset_date, is_admin, created_at, vip, vip_expires_at, allowed_ips, orbit_ip_token, email_verified, verification_code, verification_expires_at, referral_code, referred_by, base_requests_limit, referral_bonus_expires_at)
      VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, 0, ?, 0, NULL, NULL, ?, 0, ?, ?, ?, ?, ?, ?)`,
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
      user.verification_expires_at,
      referralCode,
      referrer ? referrer.id : null,
      baseLimit,
      bonusExpiresAt
    ]
  });

  if (referrer) {
    await grantReferralBonus(referrer);
    await client.execute({
      sql: `INSERT INTO orbit_notifications (id, user_id, title, message, created_at) VALUES (?, ?, ?, ?, ?)`,
      args: [
        crypto.randomUUID(),
        referrer.id,
        "¡Nuevo invitado!",
        `${name} se registró con tu enlace. Ganaste +${REFERRAL_BONUS_REQUESTS} solicitudes/día por ${REFERRAL_BONUS_DAYS} días.`,
        new Date().toISOString()
      ]
    });
  }

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
    html: welcomeEmailHtml({ name: user.name, email: user.email, orbitIp: user.orbit_ip_token, apiKey: user.api_key })
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

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ ok: false, error: "Completa todos los campos" });
  }

  const result = await client.execute({
    sql: "SELECT * FROM orbit_users WHERE email = ?",
    args: [email]
  });

  const user = result.rows[0];

  // Respuesta genérica siempre: no revela si el correo existe o no.
  res.json({ ok: true, message: "Si el correo existe, te enviamos un enlace para restablecer tu contraseña" });

  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TTL_MS).toISOString();

  await client.execute({
    sql: "UPDATE orbit_users SET reset_token = ?, reset_expires_at = ? WHERE id = ?",
    args: [token, expiresAt, user.id]
  });

  const resetUrl = `${req.protocol}://${req.get("host")}/reset-password?token=${token}`;

  sendMail({
    to: user.email,
    subject: "Restablece tu contraseña — Orbit API",
    html: resetPasswordEmailHtml({ name: user.name, resetUrl })
  });
});

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ ok: false, error: "Completa todos los campos" });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ ok: false, error: "La contrasena debe tener al menos 6 caracteres" });
  }

  const result = await client.execute({
    sql: "SELECT * FROM orbit_users WHERE reset_token = ?",
    args: [token]
  });

  const user = result.rows[0];

  if (!user) {
    return res.status(400).json({ ok: false, error: "Enlace inválido o ya usado" });
  }

  if (!user.reset_expires_at || new Date(user.reset_expires_at).getTime() < Date.now()) {
    return res.status(400).json({ ok: false, error: "El enlace expiró, solicita uno nuevo" });
  }

  await client.execute({
    sql: "UPDATE orbit_users SET password = ?, reset_token = NULL, reset_expires_at = NULL WHERE id = ?",
    args: [password, user.id]
  });

  res.json({ ok: true, message: "Contraseña actualizada" });
});

router.get("/github", (req, res) => {
  const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/github/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent("read:user user:email")}`;
  res.redirect(url);
});

router.get("/github/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect("/login?error=github");

  try {
    const redirectUri = `${req.protocol}://${req.get("host")}/api/auth/github/callback`;

    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      { client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code, redirect_uri: redirectUri },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      console.error("[github oauth] sin access_token:", tokenResponse.data);
      return res.redirect("/login?error=github");
    }

    const ghHeaders = { Authorization: `Bearer ${accessToken}`, "User-Agent": "Orbit-API" };
    const [profileRes, emailsRes] = await Promise.all([
      axios.get("https://api.github.com/user", { headers: ghHeaders }),
      axios.get("https://api.github.com/user/emails", { headers: ghHeaders })
    ]);

    const ghUser = profileRes.data;
    const emails = Array.isArray(emailsRes.data) ? emailsRes.data : [];
    const primaryEmail = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified) || emails[0];
    const email = primaryEmail?.email || ghUser.email;

    if (!email) {
      return res.redirect("/login?error=github_no_email");
    }

    const existing = await client.execute({
      sql: "SELECT * FROM orbit_users WHERE github_id = ? OR email = ?",
      args: [String(ghUser.id), email]
    });

    let user = existing.rows[0];

    if (!user) {
      const referralCode = await generateUniqueReferralCode(ghUser.name || ghUser.login);

      user = {
        id: crypto.randomUUID(),
        name: ghUser.name || ghUser.login,
        email,
        password: crypto.randomBytes(24).toString("hex"),
        api_key: generateApiKey(),
        requests_remaining: 100,
        requests_limit: 100,
        requests_reset_date: todayStamp(),
        created_at: new Date().toISOString(),
        orbit_ip_token: generateOrbitIp(),
        github_id: String(ghUser.id),
        verification_code: generateVerificationCode(),
        verification_expires_at: new Date(Date.now() + VERIFICATION_TTL_MS).toISOString()
      };

      await client.execute({
        sql: `INSERT INTO orbit_users
          (id, name, email, password, photo, api_key, requests_remaining, requests_limit, requests_reset_date, is_admin, created_at, vip, vip_expires_at, allowed_ips, orbit_ip_token, email_verified, verification_code, verification_expires_at, github_id, referral_code, base_requests_limit)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, NULL, NULL, ?, 0, ?, ?, ?, ?, ?)`,
        args: [
          user.id,
          user.name,
          user.email,
          user.password,
          ghUser.avatar_url || null,
          user.api_key,
          user.requests_remaining,
          user.requests_limit,
          user.requests_reset_date,
          user.created_at,
          user.orbit_ip_token,
          user.verification_code,
          user.verification_expires_at,
          user.github_id,
          referralCode,
          100
        ]
      });

      res.redirect(`/verify?email=${encodeURIComponent(user.email)}`);

      // Igual que el registro normal: solo el código, la bienvenida
      // (con IP y api key) llega recién cuando verifique en /verify.
      sendMail({
        to: user.email,
        subject: "Tu código de verificación — Orbit API",
        html: verificationEmailHtml({ name: user.name, code: user.verification_code })
      });
      return;
    }

    if (!user.github_id) {
      await client.execute({
        sql: "UPDATE orbit_users SET github_id = ? WHERE id = ?",
        args: [String(ghUser.id), user.id]
      });
    }

    if (Number(user.email_verified) !== 1) {
      // Cuenta existente (registrada por correo/contraseña) que nunca
      // verificó: la vinculamos a GitHub arriba, pero igual debe
      // completar la verificación antes de tener sesión.
      return res.redirect(`/verify?email=${encodeURIComponent(user.email)}`);
    }

    const session = await createSession(user.id);
    res.cookie("orbit_session", session.token, COOKIE_OPTS);
    res.redirect("/dashboard");
  } catch (error) {
    console.error("[github oauth]", error.response?.data || error.message);
    res.redirect("/login?error=github");
  }
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
