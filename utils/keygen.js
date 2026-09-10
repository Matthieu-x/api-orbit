const crypto = require("crypto");

function generateApiKey() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let key = "";

  for (let i = 0; i < 5; i++) {
    key += letters[crypto.randomInt(0, letters.length)];
  }

  return `ORBIT-${key}`;
}

function generateVerificationCode() {
  const code = crypto.randomInt(0, 1000000);
  return `ORBIT-${String(code).padStart(6, "0")}`;
}

function todayStamp() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

module.exports = { generateApiKey, generateVerificationCode, todayStamp };