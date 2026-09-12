const axios = require("axios");

const SENDLIB_API_KEY = process.env.SENDLIB_API_KEY || "sl_e3620cad_b365437102b4633cbed1038d45c5157d1608ca71e57e4638881bb214";
const SENDLIB_FROM = process.env.SENDLIB_FROM || "soporte.orbitapi@gmail.com";
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

async function sendMail({ to, subject, html }) {
  const apiKey = process.env.SENDLIB_API_KEY || SENDLIB_API_KEY;
  const from = process.env.SENDLIB_FROM || SENDLIB_FROM;

  try {
    await axios.post(
      SENDLIB_URL,
      {
        from,
        to,
        subject,
        html
      },
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
    console.error(
      "[mailer] Error enviando correo con SendLib:",
      error.response?.data || error.message
    );

    return false;
  }
}

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

function emailShell({ preheader = "", title, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:${COLORS.bg};
">

<div style="
  display:none;
  max-height:0;
  overflow:hidden;
  opacity:0;
">
  ${escapeHtml(preheader)}
</div>

<table
  role="presentation"
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    width:100%;
    background:${COLORS.bg};
  "
>
  <tr>
    <td
      align="center"
      style="
        padding:48px 20px;
      "
    >

      <table
        role="presentation"
        width="100%"
        cellpadding="0"
        cellspacing="0"
        border="0"
        style="
          width:100%;
          max-width:460px;
        "
      >

        <tr>
          <td
            align="center"
            style="
              padding:0 0 34px 0;
              font-family:${FONT};
            "
          >

            <div style="
              font-family:${FONT_HEAD};
              font-size:17px;
              line-height:1.3;
              font-weight:700;
              letter-spacing:-0.02em;
              color:${COLORS.text};
            ">
              Orbit API
            </div>

            <div style="
              width:34px;
              height:2px;
              margin:10px auto 0 auto;
              background:${COLORS.accent};
              border-radius:2px;
            "></div>

          </td>
        </tr>

        <tr>
          <td
            style="
              padding:0;
              font-family:${FONT};
              color:${COLORS.text};
            "
          >
            ${bodyHtml}
          </td>
        </tr>

        <tr>
          <td
            align="center"
            style="
              padding:36px 0 0 0;
              font-family:${FONT};
            "
          >

            <div style="
              width:100%;
              height:1px;
              background:${COLORS.border};
              margin-bottom:18px;
            "></div>

            <p style="
              margin:0;
              font-size:11px;
              line-height:1.6;
              color:${COLORS.muted};
            ">
              Orbit API
            </p>

            <p style="
              margin:4px 0 0 0;
              font-size:10.5px;
              line-height:1.6;
              color:${COLORS.muted};
              opacity:.75;
            ">
              Este correo fue enviado automáticamente.
            </p>

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
      ([label, value], index) => `
<tr>

  <td
    style="
      padding:14px 0;
      width:110px;
      vertical-align:top;
      font-family:${FONT};
      font-size:10.5px;
      line-height:1.5;
      color:${COLORS.muted};
      text-transform:uppercase;
      letter-spacing:.06em;
      ${
        index < rows.length - 1
          ? `border-bottom:1px solid ${COLORS.border};`
          : ""
      }
    "
  >
    ${escapeHtml(label)}
  </td>

  <td
    style="
      padding:14px 0;
      vertical-align:top;
      text-align:right;
      font-family:${MONO};
      font-size:12.5px;
      line-height:1.5;
      color:${COLORS.text};
      word-break:break-all;
      ${
        index < rows.length - 1
          ? `border-bottom:1px solid ${COLORS.border};`
          : ""
      }
    "
  >
    ${escapeHtml(value)}
  </td>

</tr>`
    )
    .join("");

  return `
<table
  role="presentation"
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    width:100%;
    margin:26px 0;
  "
>
  ${rowsHtml}
</table>`;
}

function buttonHtml(href, label) {
  return `
<table
  role="presentation"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    margin:26px auto;
  "
>
  <tr>
    <td
      align="center"
      style="
        background:${COLORS.accent};
        border-radius:9px;
      "
    >
      <a
        href="${escapeHtml(href)}"
        style="
          display:inline-block;
          padding:12px 25px;
          font-family:${FONT};
          font-size:13.5px;
          line-height:1;
          font-weight:700;
          color:#0b1020;
          text-decoration:none;
          border-radius:9px;
        "
      >
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`;
}

function welcomeEmailHtml({ name, email, orbitIp, apiKey }) {
  const body = `
<h1 style="
  margin:0 0 10px 0;
  font-family:${FONT_HEAD};
  font-size:22px;
  line-height:1.3;
  font-weight:700;
  letter-spacing:-.02em;
  color:${COLORS.text};
  text-align:center;
">
  ¡Cuenta verificada, ${escapeHtml(name)}!
</h1>

<p style="
  margin:0 auto;
  max-width:380px;
  font-size:14px;
  line-height:1.7;
  color:${COLORS.muted};
  text-align:center;
">
  Tu cuenta de Orbit API ya está activa.
  Esta es tu información de acceso:
</p>

${dataTableHtml([
  ["Nombre", name],
  ["Correo", email],
  ["Orbit IP", orbitIp],
  ["API Key", apiKey]
])}

<p style="
  margin:0;
  font-size:13px;
  line-height:1.7;
  color:${COLORS.muted};
">
  Guarda tu
  <strong style="color:${COLORS.text};">
    API Key
  </strong>
  y tu
  <strong style="color:${COLORS.text};">
    Orbit IP
  </strong>
  en un lugar seguro.
</p>

<p style="
  margin:12px 0 0 0;
  font-size:12.5px;
  line-height:1.7;
  color:${COLORS.muted};
">
  Se utilizan para autenticar tus solicitudes a la API mediante
  <code style="
    font-family:${MONO};
    color:${COLORS.accent};
  ">apikey</code>
  y
  <code style="
    font-family:${MONO};
    color:${COLORS.accent};
  ">x-orbit-ip</code>.
</p>

${buttonHtml(
  `${process.env.APP_URL || "https://orbit-cloud.onrender.com"}/dashboard`,
  "Ir al dashboard"
)}
`;

  return emailShell({
    preheader: "Tu cuenta de Orbit API ya está activa.",
    title: "Cuenta verificada — Orbit API",
    bodyHtml: body
  });
}

function verificationEmailHtml({ name, code }) {
  const body = `
<h1 style="
  margin:0 0 10px 0;
  font-family:${FONT_HEAD};
  font-size:22px;
  line-height:1.3;
  font-weight:700;
  letter-spacing:-.02em;
  color:${COLORS.text};
  text-align:center;
">
  Verifica tu cuenta
</h1>

<p style="
  margin:0 auto 26px auto;
  max-width:370px;
  font-size:14px;
  line-height:1.7;
  color:${COLORS.muted};
  text-align:center;
">
  Hola ${escapeHtml(name)}, usa este código para verificar
  tu cuenta y activarla.
</p>

<table
  role="presentation"
  width="100%"
  cellpadding="0"
  cellspacing="0"
  border="0"
  style="
    width:100%;
    margin:0 0 20px 0;
  "
>
  <tr>
    <td
      align="center"
      style="
        padding:18px 10px;
        border-top:1px solid ${COLORS.border};
        border-bottom:1px solid ${COLORS.border};
        font-family:${MONO};
        font-size:30px;
        line-height:1.2;
        font-weight:700;
        letter-spacing:7px;
        color:${COLORS.accent};
      "
    >
      ${escapeHtml(code)}
    </td>
  </tr>
</table>

<p style="
  margin:0;
  font-size:12.5px;
  line-height:1.6;
  color:${COLORS.muted};
  text-align:center;
">
  El código vence en 15 minutos.
</p>
`;

  return emailShell({
    preheader: `Tu código de verificación: ${code}`,
    title: "Verifica tu cuenta — Orbit API",
    bodyHtml: body
  });
}

function resetPasswordEmailHtml({ name, resetUrl }) {
  const body = `
<h1 style="
  margin:0 0 10px 0;
  font-family:${FONT_HEAD};
  font-size:22px;
  line-height:1.3;
  font-weight:700;
  letter-spacing:-.02em;
  color:${COLORS.text};
  text-align:center;
">
  Restablece tu contraseña
</h1>

<p style="
  margin:0 auto;
  max-width:380px;
  font-size:14px;
  line-height:1.7;
  color:${COLORS.muted};
  text-align:center;
">
  Hola ${escapeHtml(name)}, pediste restablecer la contraseña
  de tu cuenta de Orbit API.
</p>

${buttonHtml(resetUrl, "Restablecer contraseña")}

<p style="
  margin:0 0 10px 0;
  font-size:12.5px;
  line-height:1.6;
  color:${COLORS.muted};
">
  Si el botón no funciona, copia y pega este enlace:
</p>

<p style="
  margin:0 0 20px 0;
  font-size:11.5px;
  line-height:1.6;
  word-break:break-all;
">
  <a
    href="${escapeHtml(resetUrl)}"
    style="
      color:${COLORS.accent};
      text-decoration:none;
    "
  >
    ${escapeHtml(resetUrl)}
  </a>
</p>

<p style="
  margin:0;
  font-size:12.5px;
  line-height:1.7;
  color:${COLORS.muted};
">
  El enlace vence en 30 minutos.
  Si no pediste esto, tu contraseña seguirá igual.
</p>
`;

  return emailShell({
    preheader: "Restablece la contraseña de tu cuenta de Orbit API.",
    title: "Restablecer contraseña — Orbit API",
    bodyHtml: body
  });
}

function planActivatedEmailHtml({
  name,
  planLabel,
  requestsLimit,
  price
}) {
  const priceText =
    Number(price) > 0
      ? `$${price} (pago único, sin vencimiento)`
      : "Gratis";

  const body = `
<h1 style="
  margin:0 0 10px 0;
  font-family:${FONT_HEAD};
  font-size:22px;
  line-height:1.3;
  font-weight:700;
  letter-spacing:-.02em;
  color:${COLORS.text};
  text-align:center;
">
  Tu plan ahora es ${escapeHtml(planLabel)}
</h1>

<p style="
  margin:0 auto;
  max-width:380px;
  font-size:14px;
  line-height:1.7;
  color:${COLORS.muted};
  text-align:center;
">
  Hola ${escapeHtml(name)}, un administrador activó el plan
  <strong style="color:${COLORS.text};">
    ${escapeHtml(planLabel)}
  </strong>
  en tu cuenta de Orbit API.
</p>

${dataTableHtml([
  ["Plan", planLabel],
  ["Solicitudes/día", requestsLimit],
  ["Precio", priceText]
])}

<p style="
  margin:0;
  font-size:13px;
  line-height:1.7;
  color:${COLORS.muted};
">
  Este plan queda activo de forma permanente hasta que
  un administrador lo cambie.
</p>

${buttonHtml(
  `${process.env.APP_URL || "https://orbit-cloud.onrender.com"}/dashboard`,
  "Ir al dashboard"
)}
`;

  return emailShell({
    preheader: `Tu plan ahora es ${planLabel}.`,
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
