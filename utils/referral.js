const client = require("../db/client");

const REFERRAL_BONUS_REQUESTS = 100;
const REFERRAL_BONUS_DAYS = 7;

function slugifyName(input) {
  return String(input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18);
}

// Genera un referral_code unico a partir del nombre del usuario, con un
// sufijo numerico si el slug ya esta en uso (o si el nombre esta vacio).
async function generateUniqueReferralCode(name) {
  const base = slugifyName(name) || "user";

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
    const existing = await client.execute({
      sql: "SELECT id FROM orbit_users WHERE referral_code = ?",
      args: [candidate]
    });
    if (existing.rows.length === 0) return candidate;
  }

  return `${base}-${Date.now().toString().slice(-6)}`;
}

function isReferralBonusActive(user) {
  return Boolean(user.referral_bonus_expires_at) && new Date(user.referral_bonus_expires_at).getTime() > Date.now();
}

// Si el bono de referidos de este usuario ya vencio, lo revierte al limite
// base (mismo patron que el auto-downgrade de VIP vencido).
async function revertExpiredReferralBonus(user) {
  if (Number(user.is_admin) === 1) return user;
  if (!user.referral_bonus_expires_at) return user;
  if (new Date(user.referral_bonus_expires_at).getTime() > Date.now()) return user;

  const baseLimit = Number(user.base_requests_limit || 100);

  await client.execute({
    sql: `UPDATE orbit_users
          SET referral_bonus_expires_at = NULL, requests_limit = ?,
              requests_remaining = CASE WHEN requests_remaining > ? THEN ? ELSE requests_remaining END
          WHERE id = ?`,
    args: [baseLimit, baseLimit, baseLimit, user.id]
  });

  user.referral_bonus_expires_at = null;
  user.requests_limit = baseLimit;
  user.requests_remaining = Math.min(Number(user.requests_remaining), baseLimit);
  return user;
}

// Otorga (o extiende) el bono de +100 solicitudes/dia por 7 dias a un
// usuario que invito a alguien. Si ya tenia un bono activo, la nueva
// ventana de 7 dias se suma a partir de su vencimiento actual.
async function grantReferralBonus(referrer) {
  const now = Date.now();
  const currentExpiry = referrer.referral_bonus_expires_at ? new Date(referrer.referral_bonus_expires_at).getTime() : 0;
  const startFrom = currentExpiry > now ? currentExpiry : now;
  const expiresAt = new Date(startFrom + REFERRAL_BONUS_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const baseLimit = Number(referrer.base_requests_limit || referrer.requests_limit || 100);
  const limit = baseLimit + REFERRAL_BONUS_REQUESTS;

  await client.execute({
    sql: `UPDATE orbit_users
          SET referral_bonus_expires_at = ?, requests_limit = ?, requests_remaining = requests_remaining + ?
          WHERE id = ?`,
    args: [expiresAt, limit, REFERRAL_BONUS_REQUESTS, referrer.id]
  });

  return { expiresAt, limit };
}

module.exports = {
  REFERRAL_BONUS_REQUESTS,
  REFERRAL_BONUS_DAYS,
  slugifyName,
  generateUniqueReferralCode,
  isReferralBonusActive,
  revertExpiredReferralBonus,
  grantReferralBonus
};
