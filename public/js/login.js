document.getElementById("togglePassword").addEventListener("click", () => {
  const input = document.getElementById("passwordInput");
  input.type = input.type === "password" ? "text" : "password";
});

(() => {
  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");
  if (!error) return;
  const messages = {
    github: "No se pudo iniciar sesion con GitHub, intenta de nuevo",
    github_no_email: "Tu cuenta de GitHub no tiene un correo verificado publico"
  };
  const errorBox = document.getElementById("errorBox");
  errorBox.textContent = messages[error] || "Ocurrio un error";
  errorBox.classList.add("show");
})();

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const errorBox = document.getElementById("errorBox");
  const submitBtn = document.getElementById("submitBtn");
  errorBox.classList.remove("show");

  const form = e.target;
  submitBtn.disabled = true;
  submitBtn.textContent = "Entrando...";

  const { status, data } = await orbitFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: form.email.value,
      password: form.password.value
    })
  });

  if (status !== 200 || !data.ok) {
    if (data.needs_verification) {
      window.location.href = `/verify?email=${encodeURIComponent(data.email || form.email.value)}`;
      return;
    }
    errorBox.textContent = data.error || "No se pudo iniciar sesion";
    errorBox.classList.add("show");
    submitBtn.disabled = false;
    submitBtn.textContent = "Entrar";
    return;
  }

  window.location.href = data.user.is_admin ? "/dashboard" : "/dashboard";
});
