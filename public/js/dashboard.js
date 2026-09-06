let rankingPage = 1;
const RANKING_PAGE_SIZE = 5;

function dashboardAvatar(user) {
  const initial = (user.name || "?").trim().charAt(0).toUpperCase();
  if (user.photo) return `<img class="ranking-avatar" src="${escapeHtml(user.photo)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="ranking-avatar ranking-fallback" style="display:none">${escapeHtml(initial)}</div>`;
  return `<div class="ranking-avatar ranking-fallback">${escapeHtml(initial)}</div>`;
}

function userBadge(user) {
  if (user.is_admin) return '<span class="pill-admin">admin</span>';
  if (user.is_vip) return '<span class="pill-vip">VIP</span>';
  return '<span class="pill-free">Free</span>';
}

async function loadDashboardStats(page = rankingPage) {
  const container = document.getElementById("topUsers");
  const { status, data } = await orbitFetch(`/api/user/dashboard-stats?page=${page}`);
  if (status !== 200 || !data.ok) {
    container.innerHTML = `<div class="notif-empty">${escapeHtml(data.error || "No se pudieron cargar las estadísticas")}</div>`;
    return;
  }
  rankingPage = Number(data.top_page || 1);
  document.getElementById("statTotal").textContent = Number(data.total_requests || 0).toLocaleString("es-HN");
  document.getElementById("statUserTotal").textContent = Number(data.user_total_requests || 0).toLocaleString("es-HN");
  const totalPages = Math.max(1, Math.min(3, Math.ceil(Number(data.top_total_users || 0) / RANKING_PAGE_SIZE)));
  document.getElementById("rankPage").textContent = `${rankingPage} / ${totalPages}`;
  document.getElementById("rankPrev").disabled = rankingPage <= 1;
  document.getElementById("rankNext").disabled = rankingPage >= totalPages;

  if (!data.top_users?.length) { container.innerHTML = '<div class="notif-empty">Todavía no hay usuarios registrados.</div>'; return; }
  container.innerHTML = data.top_users.map((user, index) => {
    const position = (rankingPage - 1) * RANKING_PAGE_SIZE + index + 1;
    return `<div class="top-user-row"><div class="top-user-position">${position}</div><div class="ranking-avatar-wrap">${dashboardAvatar(user)}</div><div class="top-user-info"><strong>${escapeHtml(user.name)} ${userBadge(user)}</strong><span>${Number(user.requests).toLocaleString("es-HN")} solicitudes</span></div><div class="top-user-count">${Number(user.requests).toLocaleString("es-HN")}</div></div>`;
  }).join("");
}

(async () => {
  const user = await initShell("dashboard"); if (!user) return;
  document.getElementById("statRemaining").textContent = Number(user.requests_remaining).toLocaleString("es-HN");
  document.getElementById("statLimit").textContent = Number(user.requests_limit).toLocaleString("es-HN");
  document.getElementById("statKey").textContent = user.api_key;
  const vip = user.is_admin ? "Admin" : user.is_vip ? `VIP · ${user.vip_expires_at ? new Date(user.vip_expires_at).toLocaleDateString("es-HN") : "Activo"}` : "Free";
  document.getElementById("statVip").textContent = vip;
  document.getElementById("rankPrev").addEventListener("click", () => loadDashboardStats(rankingPage - 1));
  document.getElementById("rankNext").addEventListener("click", () => loadDashboardStats(rankingPage + 1));
  await loadDashboardStats(1);
})();
