const axios = require("axios");

const MAX_LENGTH = 3000;

/**
 * Traduce texto usando el endpoint público de Google Translate (gtx).
 * No requiere API key propia, 100% gratuito.
 */
async function translateText(text, to = "es", from = "auto") {
  const value = String(text || "").trim();
  if (!value) {
    throw new Error("El parámetro 'text' es requerido");
  }
  if (value.length > MAX_LENGTH) {
    throw new Error(`El texto es demasiado largo (máximo ${MAX_LENGTH} caracteres)`);
  }

  const target = String(to || "es").trim().toLowerCase();
  const source = String(from || "auto").trim().toLowerCase();

  let data;
  try {
    const response = await axios.get("https://translate.googleapis.com/translate_a/single", {
      params: {
        client: "gtx",
        sl: source,
        tl: target,
        dt: "t",
        q: value
      },
      timeout: 10000
    });
    data = response.data;
  } catch (error) {
    throw new Error("No se pudo contactar el servicio de traducción");
  }

  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("No se pudo traducir el texto");
  }

  const translated = data[0]
    .filter((chunk) => Array.isArray(chunk) && typeof chunk[0] === "string")
    .map((chunk) => chunk[0])
    .join("");

  if (!translated) {
    throw new Error("No se pudo traducir el texto");
  }

  const detectedFrom = typeof data[2] === "string" && data[2] ? data[2] : source;

  return {
    translated,
    from: detectedFrom,
    to: target
  };
}

module.exports = { translateText };