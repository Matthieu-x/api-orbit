(async () => {
  const user = await initShell("ip-config");
  if (!user) return;

  const errorBox = document.getElementById("errorBox");
  const orbitIpEl = document.getElementById("orbitIp");
  const resetBtn = document.getElementById("resetBtn");

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.toggle("show", Boolean(message));
  }

  async function load() {
    const { status, data } = await orbitFetch("/api/user/ip-config");
    if (status !== 200 || !data.ok) {
      showError(data.error || "No se pudo cargar tu Orbit IP");
      return;
    }

    orbitIpEl.textContent = data.orbit_ip || "No configurada";
  }

  resetBtn.addEventListener("click", async () => {
    resetBtn.disabled = true;
    showError("");

    const { status, data } = await orbitFetch("/api/user/ip-config/reset", {
      method: "POST"
    });

    resetBtn.disabled = false;

    if (status !== 200 || !data.ok) {
      showError(data.error || "No se pudo generar una nueva Orbit IP");
      return;
    }

    orbitIpEl.textContent = data.orbit_ip;
    showToast("Orbit IP regenerada");
  });

  await load();
})();
