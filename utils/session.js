const crypto = require("crypto");
const client = require("../db/client");

const SESSION_DAYS = 30;

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

async function createSession(userId) {
  const token = generateToken();
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await client.execute({
    sql: "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
    args: [token, userId, now.toISOString(), expires.toISOString()]
  });

  return { token, expiresAt: expires };
}

async function getSession(token) {
  if (!token) return null;

  const result = await client.execute({
    sql: "SELECT * FROM sessions WHERE token = ?",
    args: [token]
  });

  const session = result.rows[0];
  if (!session) return null;

  if (new Date(session.expires_at).getTime() < Date.now()) {
    await client.execute({ sql: "DELETE FROM sessions WHERE token = ?", args: [token] });
    return null;
  }

  return session;
}

async function destroySession(token) {
  if (!token) return;
  await client.execute({ sql: "DELETE FROM sessions WHERE token = ?", args: [token] });
}

module.exports = { createSession, getSession, destroySession, SESSION_DAYS };
