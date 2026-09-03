const client = require("../db/client");
const { todayStamp } = require("../utils/keygen");

let requestLogReady = false;

async function ensureRequestLogTable() {
  if (requestLogReady) return;

  await client.execute(`
    CREATE TABLE IF NOT EXISTS orbit_request_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  requestLogReady = true;
}

async function apiKeyAuth(req, res, next) {
  const apiKey = req.query.apikey || req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({ ok: false, error: "Falta el parametro apikey" });
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

    // Consumir una solicitud y registrar el uso real de la API.
    await client.execute({
      sql: "UPDATE orbit_users SET requests_remaining = requests_remaining - 1 WHERE id = ? AND requests_remaining > 0",
      args: [user.id]
    });

    await ensureRequestLogTable();
    await client.execute({
      sql: `INSERT INTO orbit_request_logs (user_id, endpoint, method, created_at)
            VALUES (?, ?, ?, ?)`,
      args: [user.id, req.path, req.method, new Date().toISOString()]
    });

    user.requests_remaining = Math.max(0, Number(user.requests_remaining) - 1);
    req.apiUser = user;
    next();
  } catch (error) {
    console.error("Error registrando solicitud de API:", error);
    return res.status(500).json({ ok: false, error: "Error interno al procesar la solicitud" });
  }
}

module.exports = apiKeyAuth;
