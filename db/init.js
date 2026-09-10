const crypto = require("crypto");
require("dotenv").config();
const client = require("./client");
const { generateApiKey, todayStamp } = require("../utils/keygen");
const { generateOrbitIp } = require("../utils/ip");

const FREE_DAILY_LIMIT = 100;
const VIP_DAILY_LIMIT = 1000;

async function addColumnIfMissing(column, definition) {
  try {
    await client.execute(`ALTER TABLE orbit_users ADD COLUMN ${column} ${definition}`);
  } catch (error) {
    const message = String(error?.message || error).toLowerCase();
    if (!message.includes("duplicate column") && !message.includes("already exists")) throw error;
  }
}

async function ensureSchema() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS orbit_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      photo TEXT,
      api_key TEXT UNIQUE NOT NULL,
      requests_remaining INTEGER NOT NULL DEFAULT ${FREE_DAILY_LIMIT},
      requests_limit INTEGER NOT NULL DEFAULT ${FREE_DAILY_LIMIT},
      requests_reset_date TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);

  // Migración compatible con instalaciones que ya tienen orbit_users creada.
  await addColumnIfMissing("vip", "INTEGER NOT NULL DEFAULT 0");
  await addColumnIfMissing("vip_expires_at", "TEXT");
  await addColumnIfMissing("allowed_ips", "TEXT");
  await addColumnIfMissing("orbit_ip_token", "TEXT");
  // DEFAULT 1: las cuentas ya existentes (creadas antes de este feature)
  // quedan verificadas automaticamente; solo las nuevas se insertan con 0.
  await addColumnIfMissing("email_verified", "INTEGER NOT NULL DEFAULT 1");
  await addColumnIfMissing("verification_code", "TEXT");
  await addColumnIfMissing("verification_expires_at", "TEXT");
  await addColumnIfMissing("reset_token", "TEXT");
  await addColumnIfMissing("reset_expires_at", "TEXT");
  await addColumnIfMissing("github_id", "TEXT");

  // Migra usuarios existentes al nuevo sistema. Cada cuenta recibe su propio
  // Orbit IP falso y estable, sin usar la IP real del cliente.
  const usersWithoutOrbitIp = await client.execute({
    sql: "SELECT id FROM orbit_users WHERE orbit_ip_token IS NULL OR orbit_ip_token = ''",
    args: []
  });

  for (const row of usersWithoutOrbitIp.rows) {
    let orbitIp = generateOrbitIp();
    let exists = await client.execute({
      sql: "SELECT id FROM orbit_users WHERE orbit_ip_token = ? LIMIT 1",
      args: [orbitIp]
    });

    while (exists.rows.length > 0) {
      orbitIp = generateOrbitIp();
      exists = await client.execute({
        sql: "SELECT id FROM orbit_users WHERE orbit_ip_token = ? LIMIT 1",
        args: [orbitIp]
      });
    }

    await client.execute({
      sql: "UPDATE orbit_users SET orbit_ip_token = ? WHERE id = ?",
      args: [orbitIp, row.id]
    });
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS orbit_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS orbit_notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS orbit_notification_deletions (
      user_id TEXT NOT NULL,
      notification_id TEXT NOT NULL,
      deleted_at TEXT NOT NULL,
      PRIMARY KEY (user_id, notification_id)
    )
  `);

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

async function ensureAdmin(email, name) {
  if (!email) return;
  const existing = await client.execute({
    sql: "SELECT id FROM orbit_users WHERE email = ?",
    args: [email]
  });

  if (existing.rows.length > 0) return;

  await client.execute({
    sql: `INSERT INTO orbit_users
      (id, name, email, password, photo, api_key, requests_remaining, requests_limit, requests_reset_date, is_admin, created_at, vip, vip_expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 1, NULL)`,
    args: [
      crypto.randomUUID(),
      name,
      email,
      process.env.ADMIN_DEFAULT_PASSWORD,
      null,
      generateApiKey(),
      999999,
      999999,
      todayStamp(),
      new Date().toISOString()
    ]
  });

  console.log(`Cuenta admin creada: ${email}`);
}

async function init() {
  await ensureSchema();
  await ensureAdmin(process.env.ADMIN_EMAIL_1, process.env.ADMIN_NAME_1);
  await ensureAdmin(process.env.ADMIN_EMAIL_2, process.env.ADMIN_NAME_2);
}

module.exports = init;
module.exports.FREE_DAILY_LIMIT = FREE_DAILY_LIMIT;
module.exports.VIP_DAILY_LIMIT = VIP_DAILY_LIMIT;
