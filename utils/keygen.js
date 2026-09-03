const crypto = require("crypto");

function generateApiKey() {
  const digits = crypto.randomInt(0, 10000000000).toString().padStart(10, "0");
  return `ORBIT-${digits}`;
}

function todayStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

module.exports = { generateApiKey, todayStamp };
