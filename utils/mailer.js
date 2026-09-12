const axios = require("axios");

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

async function sendMail({ to, subject, html }) {
  try {
    await axios.post(
      SENDLIB_URL,
      {
        from: SENDLIB_FROM,
        to,
        subject,
        html
      },
      {
        headers: {
          Authorization: `Bearer ${SENDLIB_API_KEY}`,
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
  page: "#f2f0ff",
  card: "#ffffff",
  text: "#17181c",
  muted: "#62646b",
  soft: "#8a8c93",
  accent: "#6c8cff",
  border: "#eeeeF2"
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
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(title)}</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:${COLORS.page};
  font-family:${FONT};
  color:${COLORS.text};
">

<div style="
  display:none;
  max-height:0;
  overflow:hidden;
  opacity:0;
  color:transparent;
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
    background:${COLORS.page};
  "
>
  <tr>
    <td
      align="center"
      style="
        padding:42px 16px;
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
          max-width:620px;
        "
      >

        <tr>
          <td
            style="
              background:${COLORS.card};
              border-radius:24px;
              padding:48px 44px;
            "
          >

            ${bodyHtml}

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
      width:125px;
      vertical-align:top;
      font-family:${FONT};
      font-size:11px;
      line-height:1.5;
      color:${COLORS.soft};
      text-transform:uppercase;
      letter-spacing:.05em;
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
    margin:28px 0;
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
    margin:28px auto;
  "
>
  <tr>
    <td
      align="center"
      style="
        background:${COLORS.accent};
        border-radius:12px;
      "
    >
      <a
        href="${escapeHtml(href)}"
        style="
          display:inline-block;
          padding:15px 30px;
          font-family:${FONT};
          font-size:14px;
          line-height:1;
          font-weight:700;
          color:#ffffff;
          text-decoration:none;
          border-radius:12px;
        "
      >
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`;
}

function logoHtml() {
  return `
<div style="
  margin:0 0 38px 0;
  text-align:center;
">
  <div style="
    display:inline-block;
    font-family:${FONT_HEAD};
    font-size:17px;
    line-height:1.2;
    font-weight:800;
    letter-spacing:-.03em;
    color:${COLORS.text};
  ">
    Orbit API
  </div>
</div>`;
}

function welcomeEmailHtml({ name, email, orbitIp, apiKey }) {
  const body = `
${logoHtml()}

<h1 style="
  margin:0 0 12px 0;
  font-family:${FONT_HEAD};
  font-size:25px;
  line-height:1.3;
  font-weight:750;
  letter-spacing:-.025em;
  color:${COLORS.text};
  text-align:left;
">
  ¡Cuenta verificada, ${escapeHtml(name)}!
</h1>

<p style="
  margin:0;
  font-family:${FONT};
  font-size:15px;
  line-height:1.75;
  color:${COLORS.muted};
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
  font-family:${FONT};
  font-size:13.5px;
  line-height:1.75;
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
  font-family:${FONT};
  font-size:13px;
  line-height:1.75;
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
${logoHtml()}

<h1 style="
  margin:0 0 12px 0;
  font-family:${FONT_HEAD};
  font-size:25px;
  line-height:1.3;
  font-weight:750;
  letter-spacing:-.025em;
  color:${COLORS.text};
  text-align:left;
">
  Verifica tu cuenta
</h1>

<p style="
  margin:0 0 28px 0;
  font-family:${FONT};
  font-size:15px;
  line-height:1.75;
  color:${COLORS.muted};
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
    margin:0 0 24px 0;
  "
>
  <tr>
    <td
      align="center"
      style="
        padding:20px 10px;
        background:#f7f7fa;
        border-radius:14px;
        font-family:${MONO};
        font-size:30px;
        line-height:1.2;
        font-weight:700;
        letter-spacing:8px;
        color:${COLORS.accent};
      "
    >
      ${escapeHtml(code)}
    </td>
  </tr>
</table>

<p style="
  margin:0;
  font-family:${FONT};
  font-size:12.5px;
  line-height:1.6;
  color:${COLORS.soft};
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
${logoHtml()}

<h1 style="
  margin:0 0 12px 0;
  font-family:${FONT_HEAD};
  font-size:25px;
  line-height:1.3;
  font-weight:750;
  letter-spacing:-.025em;
  color:${COLORS.text};
  text-align:left;
">
  Restablece tu contraseña
</h1>

<p style="
  margin:0;
  font-family:${FONT};
  font-size:15px;
  line-height:1.75;
  color:${COLORS.muted};
">
  Hola ${escapeHtml(name)}, pediste restablecer la contraseña
  de tu cuenta de Orbit API.
  Toca el botón para elegir una nueva:
</p>

${buttonHtml(resetUrl, "Restablecer contraseña")}

<p style="
  margin:0 0 10px 0;
  font-family:${FONT};
  font-size:12.5px;
  line-height:1.6;
  color:${COLORS.muted};
">
  Si el botón no funciona, copia y pega este enlace en tu navegador:
</p>

<p style="
  margin:0 0 24px 0;
  font-family:${FONT};
  font-size:12px;
  line-height:1.65;
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
  font-family:${FONT};
  font-size:13px;
  line-height:1.7;
  color:${COLORS.muted};
">
  El enlace vence en 30 minutos.
</p>

<p style="
  margin:24px 0 0 0;
  font-family:${FONT};
  font-size:12.5px;
  line-height:1.7;
  color:${COLORS.soft};
">
  Si no pediste esto, puedes ignorar este correo.
  Tu contraseña seguirá igual.
</p>
`;

  return emailShell({
    preheader: "Restablece la contraseña de tu cuenta de Orbit API.",
    title: "Restablece tu contraseña — Orbit API",
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
${logoHtml()}

<h1 style="
  margin:0 0 12px 0;
  font-family:${FONT_HEAD};
  font-size:25px;
  line-height:1.3;
  font-weight:750;
  letter-spacing:-.025em;
  color:${COLORS.text};
  text-align:left;
">
  Tu plan ahora es ${escapeHtml(planLabel)}
</h1>

<p style="
  margin:0;
  font-family:${FONT};
  font-size:15px;
  line-height:1.75;
  color:${COLORS.muted};
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
  font-family:${FONT};
  font-size:13.5px;
  line-height:1.75;
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