// shared helpers
window.Orbit = window.Orbit || {};

Orbit.$ = (sel, root = document) => root.querySelector(sel);
Orbit.$$ = (sel, root = document) => [...root.querySelectorAll(sel)];

Orbit.showError = (el, msg) => {
  if (!el) return;
  el.textContent = msg || "Error";
  el.classList.add("show");
};

Orbit.hideError = (el) => {
  if (!el) return;
  el.classList.remove("show");
  el.textContent = "";
};

Orbit.api = async (url, opts = {}) => {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || "Error de red");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

Orbit.togglePassword = (input, btn) => {
  if (!input || !btn) return;
  btn.addEventListener("click", () => {
    const isPass = input.type === "password";
    input.type = isPass ? "text" : "password";
  });
};
