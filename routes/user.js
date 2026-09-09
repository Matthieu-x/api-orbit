const express = require("express");

const client = require("../db/client");
const { requireAuth, requireVip } = require("../middleware/auth");
const { getClientIp, parseIps, stringifyIps, maxIpsFor, isValidIp } = require("../utils/ip");

const router = express.Router();
const FREE_DAILY_LIMIT = 100;
const VIP_DAILY_LIMIT = 1000;

async function ensureRequestLogTable() {
  await client.execute(`CREATE TABLE IF NOT EXISTS orbit_request_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, endpoint TEXT NOT NULL, method TEXT NOT NULL, created_at TEXT NOT NULL)`);
}

function activeVip(user) {
  return Number(user.is_admin) === 1 || (Number(user.vip) === 1 && (!user.vip_expires_at || new Date(user.vip_expires_at).getTime() > Date.now()));
}

router.get("/dashboard-stats", requireAuth, async (req, res) => {
  try {
    await ensureRequestLogTable();
    const page = Math.max(1, Math.min(3, Number(req.query.page) || 1));
    const pageSize = 5;
    const offset = (page - 1) * pageSize;

    const totalResult = await client.execute("SELECT COUNT(*) AS total FROM orbit_request_logs");
    const userResult = await client.execute({ sql: "SELECT COUNT(*) AS total FROM orbit_request_logs WHERE user_id = ?", args: [req.user.id] });
    const countUsers = await client.execute("SELECT COUNT(*) AS total FROM orbit_users");
    const topResult = await client.execute({
      sql: `SELECT u.id, u.name, u.photo, u.is_admin, u.vip, u.vip_expires_at, COALESCE(COUNT(r.id), 0) AS requests
            FROM orbit_users u LEFT JOIN orbit_request_logs r ON r.user_id = u.id
            GROUP BY u.id, u.name, u.photo, u.is_admin, u.vip, u.vip_expires_at
            ORDER BY requests DESC, u.name ASC LIMIT ? OFFSET ?`,
      args: [pageSize, offset]
    });

    res.json({
      ok: true,
      total_requests: Number(totalResult.rows[0]?.total || 0),
      user_total_requests: Number(userResult.rows[0]?.total || 0),
      top_page: page,
      top_page_size: pageSize,
      top_total_users: Number(countUsers.rows[0]?.total || 0),
      top_has_next: page < 3 && Number(countUsers.rows[0]?.total || 0) > offset + pageSize,
      top_users: topResult.rows.map(row => ({
        id: row.id, name: row.name, photo: row.photo, is_admin: Number(row.is_admin) === 1,
        is_vip: Number(row.is_admin) === 1 || (Number(row.vip) === 1 && (!row.vip_expires_at || new Date(row.vip_expires_at).getTime() > Date.now())),
        vip_expires_at: row.vip_expires_at || null, requests: Number(row.requests || 0)
      }))
    });
  } catch (error) {
    console.error("Error cargando estadisticas del dashboard:", error);
    res.status(500).json({ ok: false, error: "No se pudieron cargar las estadisticas" });
  }
});

router.put("/profile", requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name || String(name).trim().length < 2) return res.status(400).json({ ok: false, error: "Ingresa un nombre valido" });
  await client.execute({ sql: "UPDATE orbit_users SET name = ? WHERE id = ?", args: [String(name).trim(), req.user.id] });
  res.json({ ok: true, name: String(name).trim() });
});

router.put("/profile/photo", requireAuth, async (req, res) => {
  const raw = String(req.body?.photo || "").trim();
  if (raw && !/^https?:\/\//i.test(raw)) {
    return res.status(400).json({ ok: false, error: "La foto debe ser un enlace http o https" });
  }
  await client.execute({ sql: "UPDATE orbit_users SET photo = ? WHERE id = ?", args: [raw || null, req.user.id] });
  res.json({ ok: true, photo: raw || null });
});

router.delete("/profile/photo", requireAuth, async (req, res) => {
  await client.execute({ sql: "UPDATE orbit_users SET photo = NULL WHERE id = ?", args: [req.user.id] });
  res.json({ ok: true, photo: null });
});

router.get("/notifications", requireAuth, async (req, res) => {
  const result = await client.execute({ sql: `SELECT n.* FROM orbit_notifications n LEFT JOIN orbit_notification_deletions d ON d.notification_id=n.id AND d.user_id=? WHERE (n.user_id=? OR n.user_id IS NULL) AND d.notification_id IS NULL ORDER BY n.created_at DESC LIMIT 30`, args: [req.user.id, req.user.id] });
  res.json({ ok: true, notifications: result.rows });
});

router.post("/notifications/:id/read", requireAuth, async (req, res) => {
  await client.execute({ sql: "UPDATE orbit_notifications SET read = 1 WHERE id = ? AND (user_id = ? OR user_id IS NULL)", args: [req.params.id, req.user.id] });
  res.json({ ok: true });
});

router.delete("/notifications/:id", requireAuth, async (req, res) => {
  await client.execute({ sql: `INSERT OR IGNORE INTO orbit_notification_deletions (user_id, notification_id, deleted_at) VALUES (?, ?, ?)`, args: [req.user.id, req.params.id, new Date().toISOString()] });
  res.json({ ok: true });
});

router.get("/vip", requireAuth, (req, res) => {
  res.json({ ok: true, is_vip: activeVip(req.user), vip_expires_at: req.user.vip_expires_at || null, plans: [
    { id: "7d", name: "VIP 7 días", days: 7, price: 25, currency: "HNL" },
    { id: "30d", name: "VIP 30 días", days: 30, price: 60, currency: "HNL" },
    { id: "90d", name: "VIP 90 días", days: 90, price: 150, currency: "HNL" }
  ]});
});

router.get("/ip-config", requireVip, (req, res) => {
  res.json({
    ok: true,
    ips: parseIps(req.user.allowed_ips),
    current_ip: getClientIp(req),
    max: maxIpsFor(req.user)
  });
});

router.post("/ip-config/reset", requireVip, async (req, res) => {
  const ip = getClientIp(req);
  if (!ip) return res.status(400).json({ ok: false, error: "No se pudo detectar tu IP actual" });

  const json = stringifyIps([ip], maxIpsFor(req.user));
  await client.execute({ sql: "UPDATE orbit_users SET allowed_ips = ? WHERE id = ?", args: [json, req.user.id] });
  res.json({ ok: true, ips: parseIps(json) });
});

router.post("/ip-config/add", requireVip, async (req, res) => {
  const ip = String(req.body?.ip || "").trim();
  if (!isValidIp(ip)) return res.status(400).json({ ok: false, error: "Ingresa una IP valida (IPv4 o IPv6)" });

  const max = maxIpsFor(req.user);
  const current = parseIps(req.user.allowed_ips);

  if (current.includes(ip)) return res.status(409).json({ ok: false, error: "Esa IP ya esta registrada" });
  if (current.length >= max) return res.status(400).json({ ok: false, error: `Solo puedes tener hasta ${max} IPs registradas` });

  const json = stringifyIps([...current, ip], max);
  await client.execute({ sql: "UPDATE orbit_users SET allowed_ips = ? WHERE id = ?", args: [json, req.user.id] });
  res.json({ ok: true, ips: parseIps(json) });
});

router.delete("/ip-config/:ip", requireVip, async (req, res) => {
  const target = String(req.params.ip || "").trim();
  const current = parseIps(req.user.allowed_ips);

  if (current.length <= 1) {
    return res.status(400).json({ ok: false, error: "Debes tener al menos una IP registrada. Usa restablecer en su lugar." });
  }

  const json = stringifyIps(current.filter((ip) => ip !== target));
  await client.execute({ sql: "UPDATE orbit_users SET allowed_ips = ? WHERE id = ?", args: [json, req.user.id] });
  res.json({ ok: true, ips: parseIps(json) });
});

module.exports = router;
