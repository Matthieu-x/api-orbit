const MAX_LENGTH = 5000;

/**
 * Codifica o decodifica texto en Base64. 100% local, sin API externa.
 */
function base64Process(text, action = "encode") {
  const value = String(text ?? "");
  if (!value) {
    throw new Error("El parámetro 'text' es requerido");
  }
  if (value.length > MAX_LENGTH) {
    throw new Error(`El texto es demasiado largo (máximo ${MAX_LENGTH} caracteres)`);
  }

  const mode = String(action || "encode").trim().toLowerCase();

  if (mode === "decode") {
    try {
      const decoded = Buffer.from(value, "base64").toString("utf8");
      if (!decoded && value.length > 0) {
        throw new Error("Texto Base64 inválido");
      }
      return decoded;
    } catch (error) {
      throw new Error("No se pudo decodificar el texto, verifica que sea Base64 válido");
    }
  }

  return Buffer.from(value, "utf8").toString("base64");
}

module.exports = { base64Process };