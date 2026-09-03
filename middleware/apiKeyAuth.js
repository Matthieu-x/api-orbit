const client = require("../db/client");
const { todayStamp } = require("../utils/keygen");

async function apiKeyAuth(req, res, next) {
  const apiKey = req.query.apikey || req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({ ok: false, error: "Falta el parametro apikey" });
  }

  const result = await client.execute({
    sql: "SELECT * FROM orbit_users WHERE api_key = ?",
    args: [apiKey]
  });

  if (result.rows.length === 0) {
    return res.status(401).json({ ok: false, error: "API key invalida" });
  }

  const user = result.rows[0];
  const today = todayStamp();

  if (user.requests_reset_date !== today) {
    await client.execute({
      sql: "UPDATE orbit_users SET requests_remaining = requests_limit, requests_reset_date = ? WHERE id = ?",
      args: [today, user.id]
    });
    user.requests_remaining = user.requests_limit;
    user.requests_reset_date = today;
  }

  if (Number(user.requests_remaining) <= 0) {
    return res.status(429).json({ ok: false, error: "Sin solicitudes disponibles por hoy, se renuevan a las 12 a.m" });
  }

  await client.execute({
    sql: "UPDATE orbit_users SET requests_remaining = requests_remaining - 1 WHERE id = ?",
    args: [user.id]
  });

  req.apiUser = user;
  next();
}

module.exports = apiKeyAuth;
