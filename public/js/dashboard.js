function dashboardAvatar(user) {
  if (user.photo) {
    return `<img class="avatar" src="${escapeHtml(user.photo)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` +
      `<div class="avatar avatar-fallback" style="display:none">${escapeHtml((user.name || "?").trim().charAt(0).toUpperCase())}</div>`;
  }

  const initial = (user.name || "?").trim().charAt(0).toUpperCase();
  return `<div class="avatar avatar-fallback">${escapeHtml(initial)}</div>`;
}

async function loadDashboardStats() {
  const container = document.getElementById("topUsers");
  const total = document.getElementById("statTotal");
  const userTotal = document.getElementById("statUserTotal");

  const { status, data } = await orbitFetch("/api/user/dashboard-stats");

  if (status !== 200 || !data.ok) {
    container.innerHTML = `<div class="notif-empty">${escapeHtml(data.error || "No se pudieron cargar las estadísticas")}</div>`;
    return;
  }

  total.textContent = Number(data.total_requests || 0).toLocaleString("es-HN");
  userTotal.textContent = Number(data.user_total_requests || 0).toLocaleString("es-HN");

  if (!data.top_users || data.top_users.length === 0) {
    container.innerHTML = '<div class="notif-empty">Todavía no hay solicitudes registradas.</div>';
    return;
  }

  container.innerHTML = data.top_users.map((user, index) => `
    <div class="top-user-row">
      <div class="top-position">${index + 1}</div>
      ${dashboardAvatar(user)}
      <div class="top-user-info">
        <strong>${escapeHtml(user.name)}</strong>
        <span>${Number(user.requests).toLocaleString("es-HN")} solicitudes</span>
      </div>
      <div class="top-user-count">${Number(user.requests).toLocaleString("es-HN")}</div>
    </div>
  `).join("");
}

(async () => {
  const user = await initShell("dashboard");
  if (!user) return;

  document.getElementById("statRemaining").textContent = Number(user.requests_remaining).toLocaleString("es-HN");
  document.getElementById("statLimit").textContent = Number(user.requests_limit).toLocaleString("es-HN");
  document.getElementById("statKey").textContent = user.api_key;

  await loadDashboardStats();
})();
