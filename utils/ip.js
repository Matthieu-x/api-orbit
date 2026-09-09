const crypto = require("crypto");

// Orbit IP ya NO representa la IP publica del cliente.
// Es una credencial secundaria con formato de IPv4 para darle estilo visual.
function generateOrbitIp() {
  // Rango privado 10.0.0.0/8: parece una IP, pero no identifica al usuario en Internet.
  return `10.${crypto.randomInt(1, 255)}.${crypto.randomInt(0, 256)}.${crypto.randomInt(1, 255)}`;
}

function isValidOrbitIp(value) {
  const ip = String(value || "").trim();
  const match = ip.match(/^10\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return false;
  return match.slice(1).every(part => Number(part) >= 0 && Number(part) <= 255);
}

// Compatibilidad con instalaciones/codigo antiguo.
function normalizeIp(ip) {
  if (!ip) return "";
  return String(ip).trim().replace(/^::ffff:/, "");
}

// Se conserva por compatibilidad, pero YA NO se usa para autenticar la API.
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return normalizeIp(String(forwarded).split(",")[0]);
  return normalizeIp(req.socket?.remoteAddress || req.ip || "");
}

function parseIps(raw) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function stringifyIps(list, max) {
  const clean = Array.from(new Set(list.filter(Boolean)));
  return JSON.stringify(max ? clean.slice(0, max) : clean);
}

function isPrivileged(user) {
  return Number(user.is_admin) === 1 || Number(user.vip) === 1;
}

function maxIpsFor(user) {
  return isPrivileged(user) ? 5 : 1;
}

// Compatibilidad con el antiguo dashboard.
function isValidIp(ip) {
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^[0-9a-fA-F:]+$/;
  if (ipv4.test(ip)) return ip.split(".").every((part) => Number(part) <= 255);
  return ipv6.test(ip) && ip.includes(":");
}

module.exports = {
  generateOrbitIp,
  isValidOrbitIp,
  normalizeIp,
  getClientIp,
  parseIps,
  stringifyIps,
  maxIpsFor,
  isValidIp
};
