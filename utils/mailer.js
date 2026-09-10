// utils/mailer.js
const axios = require("axios");

// Credenciales de SendLib (repo privado -> hardcodeadas aquí).
// Se pueden sobreescribir con variables de entorno si en algún momento
// se prefiere no tenerlas en el código.
const SENDLIB_API_KEY = "sl_e3620cad_b365437102b4633cbed1038d45c5157d1608ca71e57e4638881bb214";
const SENDLIB_FROM = "soporte.orbitapi@gmail.com";
const SENDLIB_URL = "https://sendlib.samueltuoyo.com/api/send";
const LOGO_URL = "https://files.catbox.moe/hm29hr.png";

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

function logoHeader() {
  return `
  <div style="text-align:center; padding-bottom: 18px;">
    <img src="${LOGO_URL}" alt="Orbit API" width="56" height="56" style="width:56px; height:56px; border-radius:14px; object-fit:cover;">
  </div>`;
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

function welcomeEmailHtml({ name, email, orbitIp, apiKey }) {
  const row = (label, value) => `
    <tr>
      <td style="padding:10px 14px; font-size:12px; color:#888; text-transform:uppercase; letter-spacing:.4px; border-bottom:1px solid #ececec; white-space:nowrap;">${escapeHtml(label)}</td>
      <td style="padding:10px 14px; font-size:14px; color:#111; border-bottom:1px solid #ececec; font-family: Consolas, Menlo, monospace; word-break:break-all;">${escapeHtml(value)}</td>
    </tr>`;

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; color: #1a1a1a;">
    ${logoHeader()}
    <h2 style="color:#111; margin-bottom: 6px;">¡Cuenta verificada, ${escapeHtml(name)}!</h2>
    <p style="font-size: 15px; line-height: 1.5; margin-bottom: 20px;">Tu cuenta de Orbit API ya está activa. Esta es tu información:</p>
    <table style="width:100%; border-collapse: collapse; background:#fafafa; border-radius:10px; overflow:hidden; border:1px solid #ececec;">
      ${row("Nombre", name)}
      ${row("Correo", email)}
      ${row("Orbit IP", orbitIp)}
      ${row("API Key", apiKey)}
    </table>
    <p style="font-size: 14px; line-height: 1.5; color:#333; margin-top: 18px;">Guarda tu <strong>API Key</strong> y tu <strong>Orbit IP</strong> en un lugar seguro: ambas se usan para autenticar cada solicitud a la API (<code>apikey</code> y header <code>x-orbit-ip</code>).</p>
    <p style="color:#888; font-size:12px; margin-top: 24px;">Si no creaste esta cuenta, puedes ignorar este correo.</p>
  </div>
  `;
}

function verificationEmailHtml({ name, code }) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; color: #1a1a1a;">
    ${logoHeader()}
    <h2 style="color:#111; margin-bottom: 8px;">Verifica tu cuenta de Orbit API</h2>
    <p style="font-size: 15px; line-height: 1.5;">Hola ${escapeHtml(name)}, usa este código para verificar tu cuenta y activarla:</p>
    <p style="font-size: 26px; font-weight: bold; background:#f4f4f5; padding:16px 18px; border-radius:10px; letter-spacing:2px; text-align:center;">${escapeHtml(code)}</p>
    <p style="font-size: 14px; line-height: 1.5; color:#333;">El código vence en 15 minutos. Si no creaste esta cuenta, puedes ignorar este correo.</p>
  </div>
  `;
}

function resetPasswordEmailHtml({ name, resetUrl }) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 520px; margin: 0 auto; padding: 28px; color: #1a1a1a;">
    ${logoHeader()}
    <h2 style="color:#111; margin-bottom: 8px;">Restablece tu contraseña</h2>
    <p style="font-size: 15px; line-height: 1.5;">Hola ${escapeHtml(name)}, pediste restablecer la contraseña de tu cuenta de Orbit API. Toca el botón para elegir una nueva:</p>
    <p style="text-align:center; margin: 26px 0;">
      <a href="${resetUrl}" style="background:#6c8cff; color:#fff; text-decoration:none; font-weight:bold; padding:14px 26px; border-radius:10px; display:inline-block;">Restablecer contraseña</a>
    </p>
    <p style="font-size: 13px; line-height: 1.5; color:#666;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br><a href="${resetUrl}" style="color:#6c8cff; word-break:break-all;">${resetUrl}</a></p>
    <p style="font-size: 14px; line-height: 1.5; color:#333;">El enlace vence en 30 minutos.</p>
    <p style="color:#888; font-size:12px; margin-top: 24px;">Si no pediste esto, puedes ignorar este correo — tu contraseña seguirá igual.</p>
  </div>
  `;
}

module.exports = { sendMail, welcomeEmailHtml, verificationEmailHtml, resetPasswordEmailHtml };
