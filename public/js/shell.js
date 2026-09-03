let orbitUser = null;

const ICONS = {
  menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  bell: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
  home: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9"/></svg>',
  grid: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
  user: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.4-4 5-6 7.5-6s6.1 2 7.5 6"/></svg>',
  shield: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"/></svg>',
  logout: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M9 21H5a1 1 0 01-1-1V4a1 1 0 011-1h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
  code: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4 2 12l6 8"/><path d="M16 4l6 8-6 8"/></svg>'
};

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

function renderAvatar(user) {
  if (user.photo) {
    return `<img class="avatar" src="${user.photo}" alt="">`;
  }
  const initial = (user.name || "?").trim().charAt(0).toUpperCase();
  return `<div class="avatar avatar-fallback">${initial}</div>`;
}

async function initShell(activePage) {
  const { status, data } = await orbitFetch("/api/auth/me");

  if (status !== 200 || !data.ok) {
    window.location.href = "/register";
    return null;
  }

  orbitUser = data.user;

  const links = [
    { key: "dashboard", href: "/dashboard", label: "Dashboard", icon: ICONS.grid },
    { key: "endpoints", href: "/endpoints", label: "Endpoints", icon: ICONS.code },
    { key: "perfil", href: "/perfil", label: "Perfil", icon: ICONS.user }
  ];

  if (orbitUser.is_admin) {
    links.push({ key: "admin", href: "/admin", label: "Panel de admin", icon: ICONS.shield });
  }

  const drawerLinks = links
    .map(
      (l) => `<a class="drawer-link ${l.key === activePage ? "active" : ""}" href="${l.href}">${l.icon}<span>${l.label}</span></a>`
    )
    .join("");

  document.getElementById("shellMount").innerHTML = `
    <div class="drawer-backdrop" id="drawerBackdrop"></div>
    <div class="drawer" id="drawer">
      <div class="drawer-brand brand">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <ellipse cx="12" cy="12" rx="10" ry="4.2" stroke="currentColor" stroke-width="1.4" transform="rotate(-18 12 12)"></ellipse>
          <circle cx="12" cy="12" r="2.6" fill="var(--accent)"></circle>
        </svg>
        Orbit API
      </div>
      ${drawerLinks}
      <div class="drawer-spacer"></div>
      <a class="drawer-link" href="/" id="drawerHome">${ICONS.home}<span>Inicio</span></a>
      <a class="drawer-link" href="#" id="logoutLink">${ICONS.logout}<span>Cerrar sesion</span></a>
    </div>

    <div class="topbar">
      <div class="topbar-left">
        <button class="btn btn-icon" id="menuBtn">${ICONS.menu}</button>
        <div class="brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <ellipse cx="12" cy="12" rx="10" ry="4.2" stroke="currentColor" stroke-width="1.4" transform="rotate(-18 12 12)"></ellipse>
            <circle cx="12" cy="12" r="2.6" fill="var(--accent)"></circle>
          </svg>
          Orbit API
        </div>
      </div>
      <div class="topbar-right">
        <div class="notif-wrap">
          <button class="btn btn-icon" id="notifBtn">
            ${ICONS.bell}
            <span class="notif-dot" id="notifDot"></span>
          </button>
          <div class="dropdown" id="notifDropdown">
            <div class="dropdown-title">Notificaciones</div>
            <div id="notifList"><div class="notif-empty">Cargando...</div></div>
          </div>
        </div>
        <a href="/perfil">${renderAvatar(orbitUser)}</a>
      </div>
    </div>
  `;

  const drawer = document.getElementById("drawer");
  const backdrop = document.getElementById("drawerBackdrop");

  function openDrawer() {
    drawer.classList.add("open");
    backdrop.classList.add("open");
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    backdrop.classList.remove("open");
  }

  document.getElementById("menuBtn").addEventListener("click", openDrawer);
  backdrop.addEventListener("click", closeDrawer);

  document.getElementById("logoutLink").addEventListener("click", async (e) => {
    e.preventDefault();
    await orbitFetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  });

  const notifBtn = document.getElementById("notifBtn");
  const notifDropdown = document.getElementById("notifDropdown");

  notifBtn.addEventListener("click", () => {
    notifDropdown.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!notifDropdown.contains(e.target) && !notifBtn.contains(e.target)) {
      notifDropdown.classList.remove("open");
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
      <div class="notif-item">
        <strong>${escapeHtml(n.title)}</strong>
        <span>${escapeHtml(n.message)}</span><br>
        <span>${timeAgo(n.created_at)}</span>
      </div>`
    )
    .join("");
}
