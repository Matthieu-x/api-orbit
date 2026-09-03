const crypto = require("crypto");
require("dotenv").config();
const client = require("./client");
const { generateApiKey, todayStamp } = require("../utils/keygen");

async function ensureSchema() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS orbit_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      photo TEXT,
      api_key TEXT UNIQUE NOT NULL,
      requests_remaining INTEGER NOT NULL DEFAULT 100,
      requests_limit INTEGER NOT NULL DEFAULT 100,
      requests_reset_date TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    )
  `);

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
}

async function ensureAdmin(email, name) {
  const existing = await client.execute({
    sql: "SELECT id FROM orbit_users WHERE email = ?",
    args: [email]
  });

  if (existing.rows.length > 0) return;

  await client.execute({
    sql: `INSERT INTO orbit_users
      (id, name, email, password, photo, api_key, requests_remaining, requests_limit, requests_reset_date, is_admin, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
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
