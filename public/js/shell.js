let orbitUser = null;

const ICONS = {
  bell: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
  trash: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2"/><path d="M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13"/></svg>',
  home: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9"/></svg>',
  code: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4 2 12l6 8"/><path d="M16 4l6 8-6 8"/></svg>',
  chart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10"/><path d="M12 20V4"/><path d="M20 20v-6"/></svg>',
  store: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h16v5"/><path d="M3 9h18l-1.2 10.2a1 1 0 01-1 .8H5.2a1 1 0 01-1-.8L3 9Z"/><path d="M9 13v5"/><path d="M15 13v5"/></svg>',
  chat: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v12H8l-4 4V4Z"/></svg>',
  user: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.4-4 5-6 7.5-6s6.1 2 7.5 6"/></svg>',
  shield: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"/></svg>',
  logout: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M9 21H5a1 1 0 01-1-1V4a1 1 0 011-1h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
  lock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="9" rx="1.8"/><path d="M8 10.5V7.5a4 4 0 018 0v3"/></svg>',
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  download: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>',
  sparkle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="M12 8a4 4 0 004 4 4 4 0 00-4 4 4 4 0 00-4-4 4 4 0 004-4Z"/></svg>',
  tools: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 015 5l-6 6a4 4 0 01-5-5l1-1"/><path d="M9 9 4 4"/><path d="m6 12-3 3 3 3 3-3"/></svg>',
  anime: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01"/><path d="M8 15c1.2 1 2.6 1.5 4 1.5s2.8-.5 4-1.5"/></svg>'
};

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

function renderAvatar(user) {
  const initial = (user.name || "?").trim().charAt(0).toUpperCase();
  if (user.photo) {
    return `<img class="avatar" src="${escapeHtml(user.photo)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="avatar avatar-fallback" style="display:none">${escapeHtml(initial)}</div>`;
  }
  return `<div class="avatar avatar-fallback">${escapeHtml(initial)}</div>`;
}

async function initShell(activePage) {
  const { status, data } = await orbitFetch("/api/auth/me");

  if (status !== 200 || !data.ok) {
    window.location.href = "/register";
    return null;
  }

  orbitUser = data.user;

  const mainNav = [
    { key: "dashboard", href: "/dashboard", label: "Inicio", icon: ICONS.home },
    { key: "endpoints", href: "/endpoints", label: "Endpoints", icon: ICONS.code },
    { key: "dashboard-stats", href: "/dashboard#estadisticas", label: "Estadísticas", icon: ICONS.chart },
    { key: "vip", href: "/vip", label: "Planes", icon: ICONS.store },
    { key: "soporte", href: "https://chat.whatsapp.com/E6dq6gwGK4o0fdxn6WEZxP?s=cl&p=a&mlu=4&ilr=4", label: "Soporte", icon: ICONS.chat, external: true }
  ];

  const toolLinks = [
    { href: "/search", label: "Search", icon: ICONS.search },
    { href: "/download", label: "Download", icon: ICONS.download },
    { href: "/ia", label: "IA", icon: ICONS.sparkle },
    { href: "/tools", label: "Herramientas", icon: ICONS.tools },
    { href: "/anime", label: "Anime", icon: ICONS.anime }
  ];

  document.getElementById("shellMount").innerHTML = `
    <div class="topbar">
      <div class="topbar-left">
        <a class="brand" href="/dashboard">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <ellipse cx="12" cy="12" rx="10" ry="4.2" stroke="currentColor" stroke-width="1.4" transform="rotate(-18 12 12)"></ellipse>
            <circle cx="12" cy="12" r="2.6" fill="var(--accent)"></circle>
          </svg>
          <span>Orbit API</span>
        </a>
        <nav class="topbar-nav-icons">
          ${mainNav
            .map(
              (l) =>
                `<a class="topbar-nav-icon ${l.key === activePage ? "active" : ""}" href="${l.href}" title="${l.label}" ${l.external ? 'target="_blank" rel="noopener"' : ""}>${l.icon}</a>`
            )
            .join("")}
        </nav>
      </div>
      <div class="topbar-right">
        <div class="notif-wrap">
          <button class="btn btn-icon" id="notifBtn" type="button" aria-label="Abrir notificaciones">
            ${ICONS.bell}
            <span class="notif-dot" id="notifDot"></span>
          </button>
          <div class="dropdown" id="notifDropdown">
            <div class="dropdown-title">Notificaciones</div>
            <div id="notifList"><div class="notif-empty">Cargando...</div></div>
          </div>
        </div>
        <div class="notif-wrap">
          <button class="btn btn-icon" id="avatarBtn" type="button" aria-label="Abrir menú de cuenta" style="padding:0;overflow:hidden;border-radius:10px">
            ${renderAvatar(orbitUser)}
          </button>
          <div class="dropdown profile-dropdown" id="avatarDropdown">
            <a class="profile-dropdown-head" href="/perfil">
              ${renderAvatar(orbitUser)}
              <span>
                <strong>${escapeHtml(orbitUser.name)}</strong>
                <span>Ver tu perfil</span>
              </span>
            </a>
            <div class="profile-dropdown-usage">
              <div class="usage-meta-row">
                <span>Uso de hoy</span>
                <span>${Number(orbitUser.requests_limit - orbitUser.requests_remaining)}/${Number(orbitUser.requests_limit)}</span>
              </div>
              <div class="usage-bar" style="margin-top:8px;margin-bottom:0">
                <div class="usage-bar-fill" style="width:${Math.min(100, Math.round(((orbitUser.requests_limit - orbitUser.requests_remaining) / Math.max(1, orbitUser.requests_limit)) * 100))}%"></div>
              </div>
            </div>
            <div class="profile-dropdown-links">
              <a class="drawer-link" href="/perfil">${ICONS.user}<span>Mi perfil</span></a>
              ${toolLinks.map((l) => `<a class="drawer-link" href="${l.href}">${l.icon}<span>${l.label}</span></a>`).join("")}
              <a class="drawer-link" href="/ip-config">${ICONS.lock}<span>Configurar IP</span></a>
              ${orbitUser.is_admin ? `<a class="drawer-link" href="/admin">${ICONS.shield}<span>Panel de admin</span></a>` : ""}
              <hr class="drawer-divider">
              <a class="drawer-link" href="#" id="logoutLink">${ICONS.logout}<span>Cerrar sesión</span></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("logoutLink").addEventListener("click", async (e) => {
    e.preventDefault();
    await orbitFetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  });

  const notifBtn = document.getElementById("notifBtn");
  const notifDropdown = document.getElementById("notifDropdown");
  const avatarBtn = document.getElementById("avatarBtn");
  const avatarDropdown = document.getElementById("avatarDropdown");

  notifBtn.addEventListener("click", () => {
    avatarDropdown.classList.remove("open");
    notifDropdown.classList.toggle("open");
  });

  avatarBtn.addEventListener("click", () => {
    notifDropdown.classList.remove("open");
    avatarDropdown.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
      notifDropdown.classList.remove("open");
    }
    if (!avatarDropdown.contains(e.target) && !avatarBtn.contains(e.target)) {
      avatarDropdown.classList.remove("open");
    }
  });

  loadNotifications();

  return orbitUser;
}

async function loadNotifications() {
  const { status, data } = await orbitFetch("/api/user/notifications");
  const list = document.getElementById("notifList");
  const dot = document.getElementById("notifDot");
  if (status !== 200 || !data.ok) return;

  if (data.notifications.length === 0) {
    list.innerHTML = '<div class="notif-empty">No tienes notificaciones</div>';
    dot.classList.remove("show");
    return;
  }

  const hasUnread = data.notifications.some((n) => Number(n.read) === 0);
  dot.classList.toggle("show", hasUnread);

  list.innerHTML = data.notifications
    .map(
      (n) => `
      <div class="notif-item" data-notification-id="${escapeHtml(n.id)}">
        <div class="notif-content">
          <strong>${escapeHtml(n.title)}</strong>
          <span>${escapeHtml(n.message)}</span>
          <small>${timeAgo(n.created_at)}</small>
        </div>
        <button class="notif-delete-btn" type="button" data-id="${escapeHtml(n.id)}" aria-label="Eliminar notificación" title="Eliminar">
          ${ICONS.trash}
        </button>
      </div>`
    )
    .join("");

  list.querySelectorAll(".notif-delete-btn").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      button.disabled = true;

      const { status, data } = await orbitFetch(`/api/user/notifications/${encodeURIComponent(button.dataset.id)}`, {
        method: "DELETE"
      });

      if (status !== 200 || !data.ok) {
        button.disabled = false;
        showToast(data.error || "No se pudo eliminar la notificación");
        return;
      }

      const item = button.closest(".notif-item");
      item?.remove();

      if (!list.querySelector(".notif-item")) {
        list.innerHTML = '<div class="notif-empty">No tienes notificaciones</div>';
      }

      await loadNotifications();
    });
  });
}
