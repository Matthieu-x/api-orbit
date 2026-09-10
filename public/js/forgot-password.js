document.getElementById("forgotForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const errorBox = document.getElementById("errorBox");
  const okBox = document.getElementById("okBox");
  const submitBtn = document.getElementById("submitBtn");
  errorBox.classList.remove("show");
  okBox.classList.remove("show");

  const form = e.target;
  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando...";

  const { status, data } = await orbitFetch("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: form.email.value.trim() })
  });

  submitBtn.disabled = false;
  submitBtn.textContent = "Enviar enlace";

  if (status !== 200 || !data.ok) {
    errorBox.textContent = data.error || "No se pudo procesar la solicitud";
    errorBox.classList.add("show");
    return;
  }

  okBox.textContent = data.message || "Revisa tu correo";
  okBox.classList.add("show");
  form.reset();
});
