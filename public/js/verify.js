(() => {
  const params = new URLSearchParams(window.location.search);
  const prefilledEmail = params.get("email");
  if (prefilledEmail) document.getElementById("emailInput").value = prefilledEmail;

  const errorBox = document.getElementById("errorBox");
  const okBox = document.getElementById("okBox");

  function showError(msg) {
    okBox.style.display = "none";
    errorBox.textContent = msg;
    errorBox.classList.add("show");
  }

  function showOk(msg) {
    errorBox.classList.remove("show");
    okBox.textContent = msg;
    okBox.style.display = "block";
  }

  document.getElementById("verifyForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.remove("show");
    okBox.style.display = "none";

    const form = e.target;
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Verificando...";

    const { status, data } = await orbitFetch("/api/auth/verify", {
      method: "POST",
      body: JSON.stringify({
        email: form.email.value.trim(),
        code: form.code.value.trim().toUpperCase()
      })
    });

    if (status !== 200 || !data.ok) {
      showError(data.error || "No se pudo verificar la cuenta");
      submitBtn.disabled = false;
      submitBtn.textContent = "Verificar cuenta";
      return;
    }

    window.location.href = "/dashboard";
  });

  document.getElementById("resendBtn").addEventListener("click", async () => {
    const email = document.getElementById("emailInput").value.trim();
    if (!email) {
      showError("Escribe tu correo para reenviar el código");
      return;
    }

    const resendBtn = document.getElementById("resendBtn");
    resendBtn.disabled = true;

    const { status, data } = await orbitFetch("/api/auth/resend-verification", {
      method: "POST",
      body: JSON.stringify({ email })
    });

    resendBtn.disabled = false;

    if (status !== 200 || !data.ok) {
      showError(data.error || "No se pudo reenviar el código");
      return;
    }

    showOk("Código reenviado, revisa tu correo");
  });
})();
