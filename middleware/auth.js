const client = require("../db/client");
const { getSession } = require("../utils/session");
const { revertExpiredReferralBonus } = require("../utils/referral");

async function requireAuth(req, res, next) {
  const token = req.cookies.orbit_session;
  const session = await getSession(token);

  if (!session) {
    return res.status(401).json({ ok: false, error: "No has iniciado sesion" });
  }

  const result = await client.execute({
    sql: "SELECT * FROM orbit_users WHERE id = ?",
    args: [session.user_id]
  });

  if (result.rows.length === 0) {
    return res.status(401).json({ ok: false, error: "Cuenta no encontrada" });
  }

  req.user = await revertExpiredReferralBonus(result.rows[0]);
  next();
}

async function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (Number(req.user.is_admin) !== 1) {
      return res.status(403).json({ ok: false, error: "Acceso restringido al panel de admin" });
    }
    next();
  });
}

function isActiveVip(user) {
  if (Number(user.is_admin) === 1) return true;
  if (Number(user.vip) !== 1) return false;
  return !user.vip_expires_at || new Date(user.vip_expires_at).getTime() > Date.now();
}

async function requireVip(req, res, next) {
  requireAuth(req, res, () => {
    if (!isActiveVip(req.user)) {
      return res.status(403).json({ ok: false, error: "Esta seccion es exclusiva para VIP y administradores" });
    }
    next();
  });
}

module.exports = { requireAuth, requireAdmin, requireVip, isActiveVip };
