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

// Misma paleta que /public/css/style.css. Los correos usan tablas + estilos
// inline (los clientes de correo no cargan hojas de estilo externas), pero
// reutilizan el mismo lenguaje visual de la app: pill badges, cajas de
// icono con fondo de color, tarjetas con borde y radio 16px, acento azul.
const COLORS = {
  bg: "#05070c",
  surface: "#121826",
  surface2: "#1a2233",
  border: "#2a3448",
  text: "#f2f5fb",
  muted: "#9aa3b8",
  accent: "#6c8cff",
  accentSoft: "#1c2440",
  success: "#3dd68c"
};

const FONT = "'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const FONT_HEAD = "'Sora','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'SFMono-Regular',Consolas,Menlo,monospace";

// Icono circular con fondo de color, mismo patron que .icon-stat-icon /
// .quick-action-icon en la app (caja de color solido detras de un trazo
// blanco), en vez de un punto generico.
function iconBadgeHtml(pathsSvg) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 16px auto;">
      <tr>
        <td style="width:52px;height:52px;border-radius:16px;background:${COLORS.accentSoft};border:1px solid ${COLORS.border};text-align:center;vertical-align:middle;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${COLORS.accent}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-top:14px;">${pathsSvg}</svg>
        </td>
      </tr>
    </table>`;
}

function pillHtml(label) {
  return `<span style="display:inline-block;padding:5px 12px;border-radius:999px;border:1px solid ${COLORS.border};background:${COLORS.surface2};font-family:${FONT};font-size:10.5px;font-weight:700;letter-spacing:.07em;color:${COLORS.accent};text-transform:uppercase;">${escapeHtml(label)}</span>`;
}

function emailShell({ preheader = "", pill = "ORBIT API", iconSvg, title, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.bg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:18px;overflow:hidden;">
          <tr>
            <td style="height:4px;background:linear-gradient(90deg, ${COLORS.accent}, #9fb1ff, ${COLORS.accent});font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:36px 32px 10px 32px;text-align:center;">
              ${iconSvg ? iconBadgeHtml(iconSvg) : ""}
              ${pillHtml(pill)}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 36px 32px;font-family:${FONT};color:${COLORS.text};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;background:${COLORS.surface2};border-top:1px solid ${COLORS.border};text-align:center;">
              <p style="margin:0;font-family:${FONT};font-size:11.5px;color:${COLORS.muted};">Orbit API · Si no reconoces esta actividad, ignora este correo.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function dataTableHtml(rows) {
  const rowsHtml = rows
    .map(
      ([label, value], i) => `
      <tr>
        <td style="padding:12px 15px;font-family:${FONT};font-size:11px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:.05em;font-weight:600;${i > 0 ? `border-top:1px solid ${COLORS.border};` : ""}white-space:nowrap;">${escapeHtml(label)}</td>
        <td style="padding:12px 15px;font-family:${MONO};font-size:13px;color:${COLORS.text};${i > 0 ? `border-top:1px solid ${COLORS.border};` : ""}word-break:break-all;text-align:right;">${escapeHtml(value)}</td>
      </tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.surface2};border:1px solid ${COLORS.border};border-radius:14px;overflow:hidden;margin:20px 0;">${rowsHtml}</table>`;
}

function buttonHtml(href, label) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px auto;">
      <tr>
        <td style="border-radius:12px;background:${COLORS.accent};box-shadow:0 8px 20px rgba(108,140,255,.28);">
          <a href="${href}" style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:15px;font-weight:700;color:#0b1020;text-decoration:none;border-radius:12px;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

const ICON_KEY = '<path d="M15 7a4 4 0 1 0-3.6 5.8L4 20.2V22h3l7.5-7.5A4 4 0 0 0 15 7Z"/><circle cx="15" cy="7" r="1.2"/>';
const ICON_MAIL_CHECK = '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m4 7 8 6 8-6"/><path d="m14 16 2.5 2.5L21 14"/>';
const ICON_SPARKLE = '<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="M12 8a4 4 0 0 0 4 4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0 4-4Z"/>';

function welcomeEmailHtml({ name, email, orbitIp, apiKey }) {
  const cleanName = String(name || "").trim();
  const body = `
    <h1 style="margin:0 0 8px 0;font-family:${FONT_HEAD};font-size:21px;font-weight:700;color:${COLORS.text};text-align:center;">¡Cuenta verificada, ${escapeHtml(cleanName)}!</h1>
    <p style="margin:0 auto;max-width:380px;font-size:14px;line-height:1.65;color:${COLORS.muted};text-align:center;">Tu cuenta de Orbit API ya está activa. Esta es tu información de acceso:</p>
    ${dataTableHtml([
      ["Nombre", cleanName],
      ["Correo", email],
      ["Orbit IP", orbitIp],
      ["API Key", apiKey]
    ])}
    <p style="margin:0;font-size:13px;line-height:1.65;color:${COLORS.muted};">Guarda tu <strong style="color:${COLORS.text};">API Key</strong> y tu <strong style="color:${COLORS.text};">Orbit IP</strong> en un lugar seguro: ambas se usan para autenticar cada solicitud a la API (parámetro <code style="font-family:${MONO};color:${COLORS.accent};">apikey</code> y header <code style="font-family:${MONO};color:${COLORS.accent};">x-orbit-ip</code>).</p>
    ${buttonHtml(`${process.env.APP_URL || "https://orbit-cloud.onrender.com"}/dashboard`, "Ir al dashboard")}
  `;

  return emailShell({
    preheader: "Tu cuenta de Orbit API ya está activa.",
    pill: "CUENTA VERIFICADA",
    iconSvg: ICON_SPARKLE,
    title: "Cuenta verificada — Orbit API",
    bodyHtml: body
  });
}

function verificationEmailHtml({ name, code }) {
  const cleanName = String(name || "").trim();
  const body = `
    <h1 style="margin:0 0 8px 0;font-family:${FONT_HEAD};font-size:21px;font-weight:700;color:${COLORS.text};text-align:center;">Verifica tu cuenta</h1>
    <p style="margin:0 auto 22px auto;max-width:360px;font-size:14px;line-height:1.65;color:${COLORS.muted};text-align:center;">Hola ${escapeHtml(cleanName)}, usa este código para verificar tu cuenta y activarla:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.surface2};border:1px solid ${COLORS.border};border-radius:14px;margin-bottom:20px;">
      <tr>
        <td style="padding:22px;text-align:center;font-family:${MONO};font-size:32px;font-weight:700;letter-spacing:7px;color:${COLORS.accent};">${escapeHtml(code)}</td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;line-height:1.65;color:${COLORS.muted};text-align:center;">El código vence en 15 minutos.</p>
  `;

  return emailShell({
    preheader: `Tu código de verificación: ${code}`,
    pill: "VERIFICACIÓN",
    iconSvg: ICON_MAIL_CHECK,
    title: "Verifica tu cuenta — Orbit API",
    bodyHtml: body
  });
}

function resetPasswordEmailHtml({ name, resetUrl }) {
  const cleanName = String(name || "").trim();
  const body = `
    <h1 style="margin:0 0 8px 0;font-family:${FONT_HEAD};font-size:21px;font-weight:700;color:${COLORS.text};text-align:center;">Restablece tu contraseña</h1>
    <p style="margin:0 auto;max-width:380px;font-size:14px;line-height:1.65;color:${COLORS.muted};text-align:center;">Hola ${escapeHtml(cleanName)}, pediste restablecer la contraseña de tu cuenta de Orbit API. Toca el botón para elegir una nueva:</p>
    ${buttonHtml(resetUrl, "Restablecer contraseña")}
    <p style="margin:0 0 8px 0;font-size:12px;line-height:1.6;color:${COLORS.muted};text-align:center;">Si el botón no funciona, copia y pega este enlace:</p>
    <p style="margin:0 0 20px 0;font-size:11.5px;word-break:break-all;text-align:center;"><a href="${resetUrl}" style="color:${COLORS.accent};">${resetUrl}</a></p>
    <p style="margin:0;font-size:13px;line-height:1.65;color:${COLORS.muted};text-align:center;">El enlace vence en 30 minutos. Si no pediste esto, tu contraseña seguirá igual.</p>
  `;

  return emailShell({
    preheader: "Restablece la contraseña de tu cuenta de Orbit API.",
    pill: "RESTABLECER CONTRASEÑA",
    iconSvg: ICON_KEY,
    title: "Restablecer contraseña — Orbit API",
    bodyHtml: body
  });
}

module.exports = { sendMail, welcomeEmailHtml, verificationEmailHtml, resetPasswordEmailHtml };
