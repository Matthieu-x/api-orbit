const express = require("express");

const client = require("../db/client");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/dashboard-stats", requireAuth, async (req, res) => {
  try {
    const totalResult = await client.execute({
      sql: "SELECT COUNT(*) AS total FROM orbit_api_requests",
      args: []
    });

    const topResult = await client.execute({
      sql: `SELECT u.id, u.name, u.photo, COUNT(r.id) AS requests
            FROM orbit_api_requests r
            INNER JOIN orbit_users u ON u.id = r.user_id
            WHERE u.is_admin = 0
            GROUP BY u.id, u.name, u.photo
            ORDER BY requests DESC, u.name ASC
            LIMIT 5`,
      args: []
    });

    res.json({
      ok: true,
      total_requests: Number(totalResult.rows[0]?.total || 0),
      top_users: topResult.rows.map(row => ({
        id: row.id, name: row.name, photo: row.photo, requests: Number(row.requests || 0)
      }))
    });
  } catch (error) {
    console.error("Error obteniendo estadísticas del dashboard:", error);
    res.status(500).json({ ok: false, error: "No se pudieron cargar las estadísticas" });
  }
});


router.put("/profile/photo", requireAuth, async (req, res) => {
  const photo = typeof req.body.photo === "string" ? req.body.photo.trim() : "";

  if (!photo) {
    await client.execute({
      sql: "UPDATE orbit_users SET photo = NULL WHERE id = ?",
      args: [req.user.id]
    });
    return res.json({ ok: true, photo: null });
  }

  let parsed;
  try {
    parsed = new URL(photo);
  } catch {
    return res.status(400).json({ ok: false, error: "Ingresa un enlace de imagen válido" });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return res.status(400).json({ ok: false, error: "El enlace debe comenzar con http:// o https://" });
  }

  if (photo.length > 1000) {
    return res.status(400).json({ ok: false, error: "El enlace es demasiado largo" });
  }

  await client.execute({
    sql: "UPDATE orbit_users SET photo = ? WHERE id = ?",
    args: [photo, req.user.id]
  });

  res.json({ ok: true, photo });
});

router.delete("/profile/photo", requireAuth, async (req, res) => {
  await client.execute({
    sql: "UPDATE orbit_users SET photo = NULL WHERE id = ?",
    args: [req.user.id]
  });

  res.json({ ok: true, photo: null });
});

router.get("/notifications", requireAuth, async (req, res) => {
  const result = await client.execute({
    sql: `SELECT n.*
          FROM orbit_notifications n
          LEFT JOIN orbit_notification_deletions d
            ON d.notification_id = n.id AND d.user_id = ?
          WHERE (n.user_id = ? OR n.user_id IS NULL)
            AND d.notification_id IS NULL
          ORDER BY n.created_at DESC LIMIT 30`,
    args: [req.user.id, req.user.id]
  });

  res.json({ ok: true, notifications: result.rows });
});

router.delete("/notifications/:id", requireAuth, async (req, res) => {
  const notification = await client.execute({
    sql: `SELECT id FROM orbit_notifications
          WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
    args: [req.params.id, req.user.id]
  });

  if (notification.rows.length === 0) {
    return res.status(404).json({ ok: false, error: "Notificación no encontrada" });
  }

  await client.execute({
    sql: `INSERT OR IGNORE INTO orbit_notification_deletions (user_id, notification_id, deleted_at)
          VALUES (?, ?, ?)`,
    args: [req.user.id, req.params.id, new Date().toISOString()]
  });

  res.json({ ok: true });
});

router.post("/notifications/:id/read", requireAuth, async (req, res) => {
  await client.execute({
    sql: `UPDATE orbit_notifications SET read = 1
          WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
    args: [req.params.id, req.user.id]
  });

  res.json({ ok: true });
});

module.exports = router;
