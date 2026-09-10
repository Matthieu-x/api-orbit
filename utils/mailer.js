// utils/mailer.js
const axios = require("axios");

// Credenciales de SendLib (repo privado -> hardcodeadas aquí).
// Se pueden sobreescribir con variables de entorno si en algún momento
// se prefiere no tenerlas en el código.
const SENDLIB_API_KEY = "sl_e3620cad_b365437102b4633cbed1038d45c5157d1608ca71e57e4638881bb214";
const SENDLIB_FROM = "soporte.orbitapi@gmail.com";
const SENDLIB_URL = "https://sendlib.samueltuoyo.com/api/send";

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

/**
 * Envía un correo usando SendLib. No lanza excepción hacia afuera:
 * devuelve true/false y loguea el error, para que un fallo de correo
 * nunca tumbe el flujo de registro/login.
 */
async function sendMail({ to, subject, html }) {
  const apiKey = process.env.SENDLIB_API_KEY || SENDLIB_API_KEY;
  const from = process.env.SENDLIB_FROM || SENDLIB_FROM;

  try {
    await axios.post(
      SENDLIB_URL,
      { from, to, subject, html },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      }
    );
    console.log(`[mailer] Correo enviado a ${to}`);
    return true;
  } catch (error) {
    console.error("[mailer] Error enviando correo con SendLib:", error.response?.data || error.message);
    return false;
  }
}

function welcomeEmailHtml({ name, apiKey }) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; color: #1a1a1a;">
    <h2 style="color:#111; margin-bottom: 8px;">¡Bienvenido a Orbit API, ${escapeHtml(name)}!</h2>
    <p style="font-size: 15px; line-height: 1.5;">Tu cuenta se creó correctamente. Esta es tu API key personal:</p>
    <p style="font-size: 20px; font-weight: bold; background:#f4f4f5; padding:14px 18px; border-radius:10px; letter-spacing:1px; text-align:center;">${escapeHtml(apiKey)}</p>
    <p style="font-size: 14px; line-height: 1.5; color:#333;">Guárdala en un lugar seguro: la necesitas en el parámetro <code>apikey</code> de cada solicitud a la API.</p>
    <p style="color:#888; font-size:12px; margin-top: 24px;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
  </div>
  `;
}

function verificationEmailHtml({ name, code }) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; color: #1a1a1a;">
    <h2 style="color:#111; margin-bottom: 8px;">Verifica tu cuenta de Orbit API</h2>
    <p style="font-size: 15px; line-height: 1.5;">Hola ${escapeHtml(name)}, usa este código para verificar tu cuenta y activarla:</p>
    <p style="font-size: 26px; font-weight: bold; background:#f4f4f5; padding:16px 18px; border-radius:10px; letter-spacing:2px; text-align:center;">${escapeHtml(code)}</p>
    <p style="font-size: 14px; line-height: 1.5; color:#333;">El código vence en 15 minutos. Si no creaste esta cuenta, puedes ignorar este correo.</p>
  </div>
  `;
}

module.exports = { sendMail, welcomeEmailHtml, verificationEmailHtml };
