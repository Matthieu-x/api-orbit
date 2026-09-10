const crypto = require("crypto");

const CHARSETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?"
};

function parseBool(value, defaultValue) {
  if (value === undefined || value === null || value === "") return defaultValue;
  const normalized = String(value).toLowerCase();
  return normalized !== "false" && normalized !== "0";
}

function generatePassword(opts = {}) {
  const length = Math.min(Math.max(Number(opts.length) || 16, 6), 64);

  let pool = "";
  if (opts.lowercase) pool += CHARSETS.lowercase;
  if (opts.uppercase) pool += CHARSETS.uppercase;
  if (opts.numbers) pool += CHARSETS.numbers;
  if (opts.symbols) pool += CHARSETS.symbols;

  if (!pool) {
    throw new Error("Activa al menos un tipo de caracter (lowercase, uppercase, numbers o symbols)");
  }

  let password = "";
  for (let i = 0; i < length; i++) {
    password += pool[crypto.randomInt(0, pool.length)];
  }

  return password;
}

module.exports = { generatePassword, parseBool };