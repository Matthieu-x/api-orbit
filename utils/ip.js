const MAX_IPS_FREE = 1;
const MAX_IPS_VIP = 5;

function normalizeIp(ip) {
  if (!ip) return "";
  return String(ip).trim().replace(/^::ffff:/, "");
}

// Render (y la mayoria de hosts) ponen la app detras de un proxy, por eso
// se usa x-forwarded-for primero y se cae a la conexion directa si no existe.
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const first = String(forwarded).split(",")[0];
    const ip = normalizeIp(first);
    if (ip) return ip;
  }
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
  return isPrivileged(user) ? MAX_IPS_VIP : MAX_IPS_FREE;
}

// Formato basico IPv4 / IPv6, suficiente para validar lo que el usuario escribe.
function isValidIp(ip) {
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6 = /^[0-9a-fA-F:]+$/;
  if (ipv4.test(ip)) return ip.split(".").every((part) => Number(part) <= 255);
  return ipv6.test(ip) && ip.includes(":");
}

module.exports = {
  MAX_IPS_FREE,
  MAX_IPS_VIP,
  getClientIp,
  parseIps,
  stringifyIps,
  maxIpsFor,
  isValidIp
};
