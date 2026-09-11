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

// Paleta identica a /public/css/style.css (variables --bg/--surface/--accent/etc.)
// para que los correos se vean como una extension de la app, no como un
// aviso generico. Todo con estilos inline + tablas porque los clientes de
// correo no cargan hojas de estilo externas de forma confiable.
const COLORS = {
  bg: "#0a0e17",
  surface: "#121826",
  surface2: "#1a2233",
  border: "#232c40",
  text: "#e7ecf6",
  muted: "#8a93a8",
  accent: "#6c8cff",
  success: "#3dd68c"
};

const FONT = "'Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const FONT_HEAD = "'Sora','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'SFMono-Regular',Consolas,Menlo,monospace";

// Card contenedora con el logo de Orbit (mismo trazo de anillo + punto que
// el topbar de la app) y una pill con el nombre, en vez de texto plano
// sobre fondo liso.
function emailShell({ preheader = "", pill = "ORBIT API", title, bodyHtml }) {
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
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:30px 28px 6px 28px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 14px auto;">
                <tr>
                  <td style="width:40px;height:40px;border-radius:50%;border:1.5px solid ${COLORS.accent};background:${COLORS.surface2};text-align:center;vertical-align:middle;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="display:inline-block;vertical-align:middle;margin-top:10px;">
                      <ellipse cx="12" cy="12" rx="10" ry="4.2" stroke="${COLORS.accent}" stroke-width="1.4" transform="rotate(-18 12 12)"></ellipse>
                      <circle cx="12" cy="12" r="2.6" fill="${COLORS.accent}"></circle>
                    </svg>
                  </td>
                </tr>
              </table>
              <span style="display:inline-block;padding:4px 11px;border-radius:999px;border:1px solid ${COLORS.border};background:${COLORS.surface2};font-family:${FONT};font-size:10.5px;font-weight:700;letter-spacing:.06em;color:${COLORS.accent};text-transform:uppercase;">${escapeHtml(pill)}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 28px 30px 28px;font-family:${FONT};color:${COLORS.text};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;border-top:1px solid ${COLORS.border};text-align:center;">
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
      ([label, value]) => `
      <tr>
        <td style="padding:11px 14px;font-family:${FONT};font-size:11px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid ${COLORS.border};white-space:nowrap;">${escapeHtml(label)}</td>
        <td style="padding:11px 14px;font-family:${MONO};font-size:13px;color:${COLORS.text};border-bottom:1px solid ${COLORS.border};word-break:break-all;">${escapeHtml(value)}</td>
      </tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.surface2};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;margin:18px 0;">${rowsHtml}</table>`;
}

function buttonHtml(href, label) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
      <tr>
        <td style="border-radius:10px;background:${COLORS.accent};">
          <a href="${href}" style="display:inline-block;padding:13px 28px;font-family:${FONT};font-size:14.5px;font-weight:700;color:#0b1020;text-decoration:none;border-radius:10px;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

function welcomeEmailHtml({ name, email, orbitIp, apiKey }) {
  const body = `
    <h1 style="margin:0 0 8px 0;font-family:${FONT_HEAD};font-size:20px;font-weight:700;color:${COLORS.text};text-align:center;">¡Cuenta verificada, ${escapeHtml(name)}!</h1>
    <p style="margin:0 auto;max-width:380px;font-size:14px;line-height:1.6;color:${COLORS.muted};text-align:center;">Tu cuenta de Orbit API ya está activa. Esta es tu información de acceso:</p>
    ${dataTableHtml([
      ["Nombre", name],
      ["Correo", email],
      ["Orbit IP", orbitIp],
      ["API Key", apiKey]
    ])}
    <p style="margin:0;font-size:13px;line-height:1.6;color:${COLORS.muted};">Guarda tu <strong style="color:${COLORS.text};">API Key</strong> y tu <strong style="color:${COLORS.text};">Orbit IP</strong> en un lugar seguro: ambas se usan para autenticar cada solicitud a la API (parámetro <code style="font-family:${MONO};color:${COLORS.accent};">apikey</code> y header <code style="font-family:${MONO};color:${COLORS.accent};">x-orbit-ip</code>).</p>
    ${buttonHtml(`${process.env.APP_URL || "https://orbit-cloud.onrender.com"}/dashboard`, "Ir al dashboard")}
  `;

  return emailShell({
    preheader: "Tu cuenta de Orbit API ya está activa.",
    pill: "Cuenta verificada",
    title: "Cuenta verificada — Orbit API",
    bodyHtml: body
  });
}

function verificationEmailHtml({ name, code }) {
  const body = `
    <h1 style="margin:0 0 8px 0;font-family:${FONT_HEAD};font-size:20px;font-weight:700;color:${COLORS.text};text-align:center;">Verifica tu cuenta</h1>
    <p style="margin:0 auto 22px auto;max-width:360px;font-size:14px;line-height:1.6;color:${COLORS.muted};text-align:center;">Hola ${escapeHtml(name)}, usa este código para verificar tu cuenta y activarla:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.surface2};border:1px solid ${COLORS.border};border-radius:12px;margin-bottom:20px;">
      <tr>
        <td style="padding:20px;text-align:center;font-family:${MONO};font-size:30px;font-weight:700;letter-spacing:6px;color:${COLORS.accent};">${escapeHtml(code)}</td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;line-height:1.6;color:${COLORS.muted};text-align:center;">El código vence en 15 minutos.</p>
  `;

  return emailShell({
    preheader: `Tu código de verificación: ${code}`,
    pill: "Verificación",
    title: "Verifica tu cuenta — Orbit API",
    bodyHtml: body
  });
}

function resetPasswordEmailHtml({ name, resetUrl }) {
  const body = `
    <h1 style="margin:0 0 8px 0;font-family:${FONT_HEAD};font-size:20px;font-weight:700;color:${COLORS.text};text-align:center;">Restablece tu contraseña</h1>
    <p style="margin:0 auto;max-width:380px;font-size:14px;line-height:1.6;color:${COLORS.muted};text-align:center;">Hola ${escapeHtml(name)}, pediste restablecer la contraseña de tu cuenta de Orbit API. Toca el botón para elegir una nueva:</p>
    ${buttonHtml(resetUrl, "Restablecer contraseña")}
    <p style="margin:0 0 10px 0;font-size:12.5px;line-height:1.6;color:${COLORS.muted};">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
    <p style="margin:0 0 18px 0;font-size:12px;word-break:break-all;"><a href="${resetUrl}" style="color:${COLORS.accent};">${resetUrl}</a></p>
    <p style="margin:0;font-size:13px;line-height:1.6;color:${COLORS.muted};">El enlace vence en 30 minutos. Si no pediste esto, tu contraseña seguirá igual.</p>
  `;

  return emailShell({
    preheader: "Restablece la contraseña de tu cuenta de Orbit API.",
    pill: "Restablecer contraseña",
    title: "Restablecer contraseña — Orbit API",
    bodyHtml: body
  });
}

// Correo que se envía cuando un admin activa/cambia el plan de un usuario.
// Los planes de Orbit API NO son temporales: quedan activos hasta que un
// admin los cambie, así que este correo no menciona fecha de vencimiento.
function planActivatedEmailHtml({ name, planLabel, requestsLimit, price }) {
  const priceText = Number(price) > 0 ? `$${price} (pago único, sin vencimiento)` : "Gratis";
  const body = `
    <h1 style="margin:0 0 8px 0;font-family:${FONT_HEAD};font-size:20px;font-weight:700;color:${COLORS.text};text-align:center;">Tu plan ahora es ${escapeHtml(planLabel)}</h1>
    <p style="margin:0 auto;max-width:380px;font-size:14px;line-height:1.6;color:${COLORS.muted};text-align:center;">Hola ${escapeHtml(name)}, un administrador activó el plan <strong style="color:${COLORS.text};">${escapeHtml(planLabel)}</strong> en tu cuenta de Orbit API. Ya está disponible.</p>
    ${dataTableHtml([
      ["Plan", planLabel],
      ["Solicitudes/día", requestsLimit],
      ["Precio", priceText]
    ])}
    <p style="margin:0;font-size:13px;line-height:1.6;color:${COLORS.muted};">Este plan queda activo de forma permanente hasta que un administrador lo cambie: no vence ni se renueva automáticamente.</p>
    ${buttonHtml(`${process.env.APP_URL || "https://orbit-cloud.onrender.com"}/dashboard`, "Ir al dashboard")}
  `;

  return emailShell({
    preheader: `Tu plan ahora es ${planLabel}.`,
    pill: "Plan activado",
    title: "Plan activado — Orbit API",
    bodyHtml: body
  });
}

module.exports = {
  sendMail,
  welcomeEmailHtml,
  verificationEmailHtml,
  resetPasswordEmailHtml,
  planActivatedEmailHtml
};
