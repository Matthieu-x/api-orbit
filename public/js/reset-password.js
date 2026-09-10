document.getElementById("togglePassword").addEventListener("click", () => {
  const input = document.getElementById("passwordInput");
  input.type = input.type === "password" ? "text" : "password";
});

document.getElementById("resetForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const errorBox = document.getElementById("errorBox");
  const okBox = document.getElementById("okBox");
  const submitBtn = document.getElementById("submitBtn");
  errorBox.classList.remove("show");
  okBox.classList.remove("show");

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) {
    errorBox.textContent = "Enlace inválido: falta el token. Pide uno nuevo desde 'Olvidé mi contraseña'.";
    errorBox.classList.add("show");
    return;
  }

  const form = e.target;
  submitBtn.disabled = true;
  submitBtn.textContent = "Guardando...";

  const { status, data } = await orbitFetch("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password: form.password.value })
  });

  if (status !== 200 || !data.ok) {
    errorBox.textContent = data.error || "No se pudo restablecer la contraseña";
    errorBox.classList.add("show");
    submitBtn.disabled = false;
    submitBtn.textContent = "Restablecer contraseña";
    return;
  }

  okBox.textContent = "Contraseña actualizada. Ya puedes iniciar sesión.";
  okBox.classList.add("show");
  submitBtn.textContent = "Listo";
  setTimeout(() => { window.location.href = "/login"; }, 1800);
});
