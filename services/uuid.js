const crypto = require("crypto");

/**
 * Genera uno o varios UUID v4. 100% local, sin API externa.
 */
function generateUuids(count = 1) {
  const total = Math.min(Math.max(Number(count) || 1, 1), 50);
  return Array.from({ length: total }, () => crypto.randomUUID());
}

module.exports = { generateUuids };