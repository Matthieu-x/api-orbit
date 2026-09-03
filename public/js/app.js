function showToast(message) {
  let toast = document.getElementById("orbitToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "orbitToast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.__orbitToastTimer);
  window.__orbitToastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function orbitFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...options
  });
  const data = await res.json().catch(() => ({ ok: false, error: "Respuesta invalida del servidor" }));
  return { status: res.status, data };
}

function copyToClipboard(text, label) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`${label} copiado`);
  });
}
