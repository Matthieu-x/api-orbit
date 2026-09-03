let orbitCaptchaWidgetId = null;
let orbitSitekey = null;

async function onHcaptchaReady() {
  const { data } = await orbitFetch("/api/auth/config");
  orbitSitekey = data.hcaptchaSitekey;
  orbitCaptchaWidgetId = hcaptcha.render("captchaContainer", { sitekey: orbitSitekey });
}

window.onHcaptchaReady = onHcaptchaReady;

document.getElementById("togglePassword").addEventListener("click", () => {
  const input = document.getElementById("passwordInput");
  input.type = input.type === "password" ? "text" : "password";
});

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const errorBox = document.getElementById("errorBox");
  const submitBtn = document.getElementById("submitBtn");
  errorBox.classList.remove("show");

  const form = e.target;
  const captchaToken = typeof hcaptcha !== "undefined" ? hcaptcha.getResponse(orbitCaptchaWidgetId) : "";

  if (!captchaToken) {
    errorBox.textContent = "Completa la verificacion captcha";
    errorBox.classList.add("show");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Creando cuenta...";

  const { status, data } = await orbitFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: form.name.value,
      email: form.email.value,
      password: form.password.value,
      captchaToken
    })
  });

  if (status !== 200 || !data.ok) {
    errorBox.textContent = data.error || "No se pudo crear la cuenta";
    errorBox.classList.add("show");
    submitBtn.disabled = false;
    submitBtn.textContent = "Registrarme";
    if (typeof hcaptcha !== "undefined") hcaptcha.reset(orbitCaptchaWidgetId);
    return;
  }

  window.location.href = "/dashboard";
});
