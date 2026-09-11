let pendingUserId = null;
const PLUS_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
const TRASH_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2"/><path d="M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13"/></svg>';

const PLAN_LABELS = { free: "Free", basic: "Basic", plus: "Plus", vip: "VIP", superorbit: "SuperOrbit" };
const PLAN_CLASS = { free: "pill-free", basic: "pill-basic", plus: "pill-plus", vip: "pill-vip", superorbit: "pill-superorbit" };

function vipBadge(u){
  if(Number(u.is_admin)===1)return '<span class="pill-admin">admin</span>';
  const plan = u.plan || 'free';
  return `<span class="${PLAN_CLASS[plan] || 'pill-free'}">${PLAN_LABELS[plan] || 'Free'}</span>`;
}
function vipText(u){if(Number(u.is_admin)===1)return 'Acceso completo';const plan=u.plan||'free';return plan==='free'?'Sin plan activo':'Plan permanente (sin vencimiento)';}

async function loadUsers(search) {
  const url = search ? `/api/admin/users?search=${encodeURIComponent(search)}` : "/api/admin/users";
  const { status, data } = await orbitFetch(url);
  const body = document.getElementById("usersBody");
  if (status !== 200 || !data.ok) { body.innerHTML = '<tr><td colspan="7" class="muted">No se pudieron cargar los usuarios</td></tr>'; return; }
  if (!data.users.length) { body.innerHTML = '<tr><td colspan="7" class="muted">Sin resultados</td></tr>'; return; }
  body.innerHTML = data.users.map(u => `<tr><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.email)}</td><td>${vipBadge(u)}<small class="admin-vip-date">${escapeHtml(vipText(u))}</small></td><td class="mono">${escapeHtml(u.api_key)}</td><td>${u.requests_remaining} / ${u.requests_limit}</td><td>${Number(u.is_admin)===1?'<span class="pill-admin">admin</span>':vipBadge(u)}</td><td><div class="row-actions"><button class="btn btn-icon vip-btn" data-id="${escapeHtml(u.id)}" title="Gestionar VIP">${PLUS_ICON}</button><button class="btn btn-icon add-req-btn" data-id="${escapeHtml(u.id)}" title="Agregar solicitudes">${PLUS_ICON}</button><button class="btn btn-icon delete-btn" data-id="${escapeHtml(u.id)}" title="Eliminar cuenta">${TRASH_ICON}</button></div></td></tr>`).join("");

  body.querySelectorAll('.vip-btn').forEach(btn=>btn.addEventListener('click',()=>{pendingUserId=btn.dataset.id;document.getElementById('planSelectInput').value='basic';document.getElementById('vipModal').classList.add('open')}));
  body.querySelectorAll('.add-req-btn').forEach(btn=>btn.addEventListener('click',()=>{pendingUserId=btn.dataset.id;document.getElementById('addReqInput').value='100';document.getElementById('addReqModal').classList.add('open')}));
  body.querySelectorAll('.delete-btn').forEach(btn=>btn.addEventListener('click',()=>{pendingUserId=btn.dataset.id;document.getElementById('deleteModal').classList.add('open')}));
}
function closeModals(){document.querySelectorAll('.modal-backdrop').forEach(m=>m.classList.remove('open'));pendingUserId=null;}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModals()});

(async()=>{
  const user=await initShell('admin'); if(!user)return; loadUsers('');
  document.getElementById('userSearch').addEventListener('input',e=>loadUsers(e.target.value));
  document.getElementById('openNotifBtn').addEventListener('click',()=>document.getElementById('notifModal').classList.add('open'));
  document.getElementById('cancelNotifBtn').addEventListener('click',closeModals);document.getElementById('cancelAddReqBtn').addEventListener('click',closeModals);document.getElementById('cancelDeleteBtn').addEventListener('click',closeModals);document.getElementById('cancelVipBtn').addEventListener('click',closeModals);
  document.getElementById('notifForm').addEventListener('submit',async e=>{e.preventDefault();const f=e.target;const {status,data}=await orbitFetch('/api/admin/notifications',{method:'POST',body:JSON.stringify({title:f.title.value,message:f.message.value})});if(status!==200||!data.ok)return showToast(data.error||'No se pudo enviar la notificación');f.reset();closeModals();showToast('Notificación enviada')});
  document.getElementById('confirmAddReqBtn').addEventListener('click',async()=>{const amount=Number(document.getElementById('addReqInput').value);const {status,data}=await orbitFetch(`/api/admin/users/${pendingUserId}/add-requests`,{method:'POST',body:JSON.stringify({amount})});if(status!==200||!data.ok)return showToast(data.error||'No se pudieron agregar solicitudes');closeModals();showToast('Solicitudes agregadas');loadUsers(document.getElementById('userSearch').value)});
  document.getElementById('confirmVipBtn').addEventListener('click',async()=>{const plan=document.getElementById('planSelectInput').value;const {status,data}=await orbitFetch(`/api/admin/users/${pendingUserId}/plan`,{method:'POST',body:JSON.stringify({plan})});if(status!==200||!data.ok)return showToast(data.error||'No se pudo activar el plan');closeModals();showToast(`Plan ${PLAN_LABELS[plan]} activado`);loadUsers(document.getElementById('userSearch').value)});
  document.getElementById('removeVipBtn').addEventListener('click',async()=>{const {status,data}=await orbitFetch(`/api/admin/users/${pendingUserId}/plan`,{method:'DELETE'});if(status!==200||!data.ok)return showToast(data.error||'No se pudo volver a Free');closeModals();showToast('Cuenta vuelta a Free');loadUsers(document.getElementById('userSearch').value)});
  document.getElementById('confirmDeleteBtn').addEventListener('click',async()=>{const {status,data}=await orbitFetch(`/api/admin/users/${pendingUserId}`,{method:'DELETE'});if(status!==200||!data.ok)return showToast(data.error||'No se pudo eliminar la cuenta');closeModals();showToast('Cuenta eliminada');loadUsers(document.getElementById('userSearch').value)});
})();
