const client = require("../db/client");
const { todayStamp } = require("../utils/keygen");
const { revertExpiredReferralBonus } = require("../utils/referral");
const { hasMinPlan, planConfig } = require("../utils/plans");

async function ensureRequestLogTable() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS orbit_request_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
}

function isVipActive(user) {
  if (Number(user.is_admin) === 1) return true;
  if (Number(user.vip) !== 1) return false;
  if (!user.vip_expires_at) return true;
  return new Date(user.vip_expires_at).getTime() > Date.now();
}

function apiKeyAuth(options = {}) {
  return async function apiKeyMiddleware(req, res, next) {
    const apiKey = req.query.apikey || req.headers["x-api-key"];
    const orbitIp = req.headers["x-orbit-ip"];

    if (!apiKey) {
      return res.status(401).json({ ok: false, error: "Falta el parametro apikey" });
    }

    if (!orbitIp) {
      return res.status(401).json({
        ok: false,
        orbit_ip_required: true,
        error: "Falta el token x-orbit-ip"
      });
    }

    try {
      const result = await client.execute({
        sql: "SELECT * FROM orbit_users WHERE api_key = ?",
        args: [apiKey]
      });

      if (result.rows.length === 0) {
        return res.status(401).json({ ok: false, error: "API key invalida" });
      }

      const user = result.rows[0];
      const today = todayStamp();

      // Los planes de Orbit API son permanentes: no vencen solos. Un admin
      // es quien los cambia (ver POST /api/admin/users/:id/plan). Por eso
      // aquí ya no hay auto-downgrade por fecha.

      // Bono de invitados vencido: vuelve al limite base del usuario.
      await revertExpiredReferralBonus(user);

      // x-orbit-ip es una segunda credencial. NO se compara con la IP real
      // del dispositivo, proxy, Render, VPS, Wi-Fi, datos móviles, etc.
      const expectedOrbitIp = String(user.orbit_ip_token || "").trim();
      const receivedOrbitIp = String(orbitIp).trim();

      if (!expectedOrbitIp) {
        return res.status(403).json({
          ok: false,
          orbit_ip_invalid: true,
          error: "Esta API key no tiene un token Orbit IP configurado. Regenera tu Orbit IP desde el dashboard."
        });
      }

      if (receivedOrbitIp !== expectedOrbitIp) {
        return res.status(403).json({
          ok: false,
          ip_blocked: true,
          error: "El token x-orbit-ip no coincide con esta API key."
        });
      }

      if (options.minPlan && !hasMinPlan(user, options.minPlan)) {
        return res.status(403).json({
          ok: false,
          plan_required: options.minPlan,
          error: `Este endpoint requiere el plan ${planConfig(options.minPlan).label} o superior`
        });
      }

      if (user.requests_reset_date !== today) {
        await client.execute({
          sql: "UPDATE orbit_users SET requests_remaining = requests_limit, requests_reset_date = ? WHERE id = ?",
          args: [today, user.id]
        });
        user.requests_remaining = user.requests_limit;
        user.requests_reset_date = today;
      }

      if (Number(user.requests_remaining) <= 0) {
        return res.status(429).json({
          ok: false,
          error: "Sin solicitudes disponibles por hoy, se renuevan a las 12 a.m"
        });
      }

      const consumed = await client.execute({
        sql: "UPDATE orbit_users SET requests_remaining = requests_remaining - 1 WHERE id = ? AND requests_remaining > 0",
        args: [user.id]
      });

      if (Number(consumed.rowsAffected || 0) === 0) {
        return res.status(429).json({ ok: false, error: "Sin solicitudes disponibles" });
      }

      try {
        await ensureRequestLogTable();
        await client.execute({
          sql: `INSERT INTO orbit_request_logs (user_id, endpoint, method, created_at) VALUES (?, ?, ?, ?)`,
          args: [user.id, req.path, req.method, new Date().toISOString()]
        });
      } catch (logError) {
        console.error("Error registrando solicitud de API:", logError);
      }

      user.requests_remaining = Math.max(0, Number(user.requests_remaining) - 1);
      req.apiUser = user;
      req.apiUserIsVip = isVipActive(user);
      next();
    } catch (error) {
      console.error("Error autenticando API:", error);
      return res.status(500).json({ ok: false, error: "Error interno al procesar la solicitud" });
    }
  };
}

module.exports = apiKeyAuth();
module.exports.apiKeyAuth = apiKeyAuth;
module.exports.isVipActive = isVipActive;
