const crypto = require("crypto");

const MAX_LENGTH = 5000;
const SUPPORTED = ["md5", "sha1", "sha256", "sha512"];

function assertValue(text) {
  const value = String(text ?? "");
  if (!value) {
    throw new Error("El parámetro 'text' es requerido");
  }
  if (value.length > MAX_LENGTH) {
    throw new Error(`El texto es demasiado largo (máximo ${MAX_LENGTH} caracteres)`);
  }
  return value;
}

/**
 * Genera el hash de un texto con un algoritmo específico. 100% local.
 */
function hashText(text, algorithm = "sha256") {
  const value = assertValue(text);
  const algo = String(algorithm || "sha256").trim().toLowerCase();

  if (!SUPPORTED.includes(algo)) {
    throw new Error(`Algoritmo no soportado. Usa uno de: ${SUPPORTED.join(", ")}`);
  }

  return crypto.createHash(algo).update(value, "utf8").digest("hex");
}

/**
 * Genera el hash de un texto con todos los algoritmos soportados.
 */
function hashAll(text) {
  const value = assertValue(text);

  const result = {};
  for (const algo of SUPPORTED) {
    result[algo] = crypto.createHash(algo).update(value, "utf8").digest("hex");
  }
  return result;
}

module.exports = { hashText, hashAll, SUPPORTED };