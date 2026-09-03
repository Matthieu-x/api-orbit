require("dotenv").config();

async function verifyCaptcha(token) {
  if (!token) return false;

  const params = new URLSearchParams();
  params.append("secret", process.env.HCAPTCHA_SECRET);
  params.append("response", token);

  const res = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });

  const data = await res.json();
  return data.success === true;
}

module.exports = { verifyCaptcha };
