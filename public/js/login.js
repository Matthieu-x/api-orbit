document.getElementById("togglePassword").addEventListener("click", () => {
  const input = document.getElementById("passwordInput");
  input.type = input.type === "password" ? "text" : "password";
});

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
    errorBox.textContent = data.error || "No se pudo iniciar sesion";
    errorBox.classList.add("show");
    submitBtn.disabled = false;
    submitBtn.textContent = "Entrar";
    return;
  }

  window.location.href = data.user.is_admin ? "/dashboard" : "/dashboard";
});
