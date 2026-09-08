const QRCode = require("qrcode");

/**
 * Genera un código QR 100% local (sin llamadas a APIs externas).
 * @param {string} text - Texto o URL a codificar.
 * @param {object} opts
 * @param {number} opts.size - Tamaño del PNG en píxeles (ancho/alto).
 * @param {string} opts.dark - Color de los módulos oscuros (hex).
 * @param {string} opts.light - Color de fondo (hex).
 * @returns {Promise<Buffer>} Buffer PNG del QR.
 */
async function generateQrBuffer(text, opts = {}) {
  const size = Math.min(Math.max(Number(opts.size) || 300, 64), 1000);

  return QRCode.toBuffer(text, {
    type: "png",
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: opts.dark || "#000000",
      light: opts.light || "#ffffff"
    }
  });
}

/**
 * Genera un código QR como Data URL base64 (para respuestas JSON).
 */
async function generateQrDataUrl(text, opts = {}) {
  const size = Math.min(Math.max(Number(opts.size) || 300, 64), 1000);

  return QRCode.toDataURL(text, {
    type: "image/png",
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: opts.dark || "#000000",
      light: opts.light || "#ffffff"
    }
  });
}

module.exports = { generateQrBuffer, generateQrDataUrl };