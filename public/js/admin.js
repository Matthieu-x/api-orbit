let pendingUserId = null;

const EYE_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
const PLUS_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
const TRASH_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2"/><path d="M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13"/></svg>';

async function loadUsers(search) {
  const url = search ? `/api/admin/users?search=${encodeURIComponent(search)}` : "/api/admin/users";
  const { status, data } = await orbitFetch(url);
  const body = document.getElementById("usersBody");

  if (status !== 200 || !data.ok) {
    body.innerHTML = '<tr><td colspan="6" class="muted">No se pudieron cargar los usuarios</td></tr>';
    return;
  }

  if (data.users.length === 0) {
    body.innerHTML = '<tr><td colspan="6" class="muted">Sin resultados</td></tr>';
    return;
  }

  body.innerHTML = data.users
    .map(
      (u) => `
      <tr>
        <td>${escapeHtml(u.name)} ${Number(u.is_admin) === 1 ? '<span class="pill-admin">admin</span>' : ""}</td>
        <td>${escapeHtml(u.email)}</td>
        <td>
          <span class="mono password-cell" data-value="${escapeHtml(u.password)}">••••••••</span>
          <button class="icon-btn toggle-pw" style="background:none;border:none;color:var(--muted);cursor:pointer;vertical-align:middle">${EYE_ICON}</button>
        </td>
        <td class="mono">${escapeHtml(u.api_key)}</td>
        <td>${u.requests_remaining} / ${u.requests_limit}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-icon add-req-btn" data-id="${u.id}" title="Agregar solicitudes">${PLUS_ICON}</button>
            <button class="btn btn-icon delete-btn" data-id="${u.id}" title="Eliminar cuenta">${TRASH_ICON}</button>
          </div>
        </td>
      </tr>`
    )
    .join("");

  body.querySelectorAll(".toggle-pw").forEach((btn) => {
    btn.addEventListener("click", () => {
      const span = btn.previousElementSibling;
      const isHidden = span.textContent === "••••••••";
      span.textContent = isHidden ? span.dataset.value : "••••••••";
    });
  });

  body.querySelectorAll(".add-req-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      pendingUserId = btn.dataset.id;
      document.getElementById("addReqModal").classList.add("open");
    });
  });

  body.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      pendingUserId = btn.dataset.id;
      document.getElementById("deleteModal").classList.add("open");
    });
  });
}

function closeModals() {
  document.querySelectorAll(".modal-backdrop").forEach((m) => m.classList.remove("open"));
  pendingUserId = null;
}

(async () => {
  const user = await initShell("admin");
  if (!user) return;

  loadUsers("");

  document.getElementById("userSearch").addEventListener("input", (e) => {
    loadUsers(e.target.value);
  });

  document.getElementById("openNotifBtn").addEventListener("click", () => {
    document.getElementById("notifModal").classList.add("open");
  });
  document.getElementById("cancelNotifBtn").addEventListener("click", closeModals);
  document.getElementById("cancelAddReqBtn").addEventListener("click", closeModals);
  document.getElementById("cancelDeleteBtn").addEventListener("click", closeModals);

  document.getElementById("notifForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;

    const { status, data } = await orbitFetch("/api/admin/notifications", {
      method: "POST",
      body: JSON.stringify({ title: form.title.value, message: form.message.value })
    });

    if (status !== 200 || !data.ok) {
      showToast(data.error || "No se pudo enviar la notificacion");
      return;
    }

    form.reset();
    closeModals();
    showToast("Notificacion enviada");
  });

  document.getElementById("confirmAddReqBtn").addEventListener("click", async () => {
    const amount = document.getElementById("addReqInput").value;
    const { status, data } = await orbitFetch(`/api/admin/users/${pendingUserId}/add-requests`, {
      method: "POST",
      body: JSON.stringify({ amount: Number(amount) })
    });

    if (status !== 200 || !data.ok) {
      showToast(data.error || "No se pudieron agregar solicitudes");
      return;
    }

    closeModals();
    showToast("Solicitudes agregadas");
    loadUsers(document.getElementById("userSearch").value);
  });

  document.getElementById("confirmDeleteBtn").addEventListener("click", async () => {
    const { status, data } = await orbitFetch(`/api/admin/users/${pendingUserId}`, {
      method: "DELETE"
    });

    if (status !== 200 || !data.ok) {
      showToast(data.error || "No se pudo eliminar la cuenta");
      return;
    }

    closeModals();
    showToast("Cuenta eliminada");
    loadUsers(document.getElementById("userSearch").value);
  });
})();
