function formatNumber(value) {
  return new Intl.NumberFormat("es-HN").format(Number(value || 0));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[char]));
}

function renderTopUsers(users) {
  const container = document.getElementById("topUsers");
  if (!container) return;
  if (!users.length) {
    container.innerHTML = '<div class="dashboard-empty">Todavía no hay solicitudes registradas.</div>';
    return;
  }
  container.innerHTML = users.map((user, index) => {
    const initial = (user.name || "?").trim().charAt(0).toUpperCase();
    const photo = user.photo ? escapeHtml(user.photo) : "";
    return `<div class="top-user-row">
      <div class="top-user-position">${index + 1}</div>
      <div class="ranking-avatar-wrap">
        ${photo ? `<img class="ranking-avatar" src="${photo}" alt="" onerror="this.remove()">` : `<div class="ranking-avatar ranking-fallback">${escapeHtml(initial)}</div>`}
      </div>
      <div class="top-user-info"><strong>${escapeHtml(user.name || "Usuario")}</strong><span>${formatNumber(user.requests)} solicitudes</span></div>
      <div class="top-user-count">${formatNumber(user.requests)}</div>
    </div>`;
  }).join("");
}

(async () => {
  const user = await initShell("dashboard");
  if (!user) return;

  document.getElementById("statRemaining").textContent = formatNumber(user.requests_remaining);
  document.getElementById("statLimit").textContent = formatNumber(user.requests_limit);
  document.getElementById("statKey").textContent = user.api_key || "No disponible";

  const response = await orbitFetch("/api/user/dashboard-stats");
  if (response.status !== 200 || !response.data?.ok) {
    document.getElementById("statTotalRequests").textContent = "0";
    document.getElementById("topUsers").innerHTML = '<div class="dashboard-empty">No se pudieron cargar las estadísticas.</div>';
    return;
  }
  document.getElementById("statTotalRequests").textContent = formatNumber(response.data.total_requests);
  renderTopUsers(response.data.top_users || []);
})();
