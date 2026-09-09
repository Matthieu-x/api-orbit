(async () => {
  const user = await initShell("ip-config");
  if (!user) return;

  if (!user.is_admin && !user.is_vip) {
    window.location.href = "/dashboard";
    return;
  }

  const errorBox = document.getElementById("errorBox");
  const currentIpEl = document.getElementById("currentIp");
  const ipCountEl = document.getElementById("ipCount");
  const ipListEl = document.getElementById("ipList");
  const addForm = document.getElementById("addForm");
  const ipInput = document.getElementById("ipInput");
  const addBtn = document.getElementById("addBtn");
  const resetBtn = document.getElementById("resetBtn");

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.toggle("show", Boolean(message));
  }

  function render(ips, currentIp, max) {
    currentIpEl.textContent = currentIp || "No detectada";
    ipCountEl.textContent = `${ips.length} / ${max}`;

    if (ips.length === 0) {
      ipListEl.innerHTML = '<p class="muted">Aun no tienes ninguna IP registrada.</p>';
      return;
    }

    ipListEl.innerHTML = ips
      .map((ip) => {
        const isCurrent = ip === currentIp;
        return `
        <div class="field-row" style="margin-bottom:10px">
          <input type="text" class="mono" value="${escapeHtml(ip)}" readonly style="flex:1">
          ${isCurrent ? '<span class="pill-vip">Esta es la tuya</span>' : ""}
          <button type="button" class="btn btn-ghost btn-icon remove-ip-btn" data-ip="${escapeHtml(ip)}" title="Quitar" aria-label="Quitar IP">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>`;
      })
      .join("");

    ipListEl.querySelectorAll(".remove-ip-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        showError("");
        const { status, data } = await orbitFetch(`/api/user/ip-config/${encodeURIComponent(btn.dataset.ip)}`, {
          method: "DELETE"
        });
        if (status !== 200 || !data.ok) {
          showError(data.error || "No se pudo quitar la IP");
          btn.disabled = false;
          return;
        }
        showToast("IP eliminada");
        await load();
      });
    });
  }

  async function load() {
    const { status, data } = await orbitFetch("/api/user/ip-config");
    if (status !== 200 || !data.ok) {
      showError(data.error || "No se pudo cargar tu configuracion de IP");
      return;
    }
    render(data.ips, data.current_ip, data.max);
  }

  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const ip = ipInput.value.trim();
    if (!ip) return;

    showError("");
    addBtn.disabled = true;

    const { status, data } = await orbitFetch("/api/user/ip-config/add", {
      method: "POST",
      body: JSON.stringify({ ip })
    });

    addBtn.disabled = false;

    if (status !== 200 || !data.ok) {
      showError(data.error || "No se pudo agregar la IP");
      return;
    }

    ipInput.value = "";
    showToast("IP agregada");
    await load();
  });

  resetBtn.addEventListener("click", async () => {
    resetBtn.disabled = true;
    showError("");

    const { status, data } = await orbitFetch("/api/user/ip-config/reset", { method: "POST" });

    resetBtn.disabled = false;

    if (status !== 200 || !data.ok) {
      showError(data.error || "No se pudo restablecer tu IP");
      return;
    }

    showToast("IP restablecida");
    await load();
  });

  await load();
})();
