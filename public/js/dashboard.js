const CATEGORIES = [
  {
    id: "consulta",
    name: "Consulta",
    tag: "Utilidades",
    path: "/api/v1/consulta",
    param: "texto",
    placeholder: "Escribe un texto de prueba"
  }
];

let activeCategory = CATEGORIES[0];
let liveTimer = null;

function renderCategoryList(filter) {
  const list = CATEGORIES.filter(
    (c) => c.name.toLowerCase().includes(filter.toLowerCase()) || c.tag.toLowerCase().includes(filter.toLowerCase())
  );

  const container = document.getElementById("categoryList");

  if (list.length === 0) {
    container.innerHTML = '<p class="muted" style="padding:10px 4px">Sin resultados para tu busqueda</p>';
    return;
  }

  container.innerHTML = list
    .map(
      (c) => `
      <div class="category-item ${activeCategory && activeCategory.id === c.id ? "active" : ""}" data-id="${c.id}">
        <span>${escapeHtml(c.name)}</span>
        <span class="tag">${escapeHtml(c.tag)}</span>
      </div>`
    )
    .join("");

  container.querySelectorAll(".category-item").forEach((el) => {
    el.addEventListener("click", () => {
      activeCategory = CATEGORIES.find((c) => c.id === el.dataset.id);
      renderCategoryList(document.getElementById("categorySearch").value);
      renderPlayground();
    });
  });
}

function buildEndpointUrl(apiKey, value) {
  const params = new URLSearchParams();
  params.set("apikey", apiKey);
  params.set(activeCategory.param, value || "");
  return `${activeCategory.path}?${params.toString()}`;
}

function renderPlayground() {
  const zone = document.getElementById("playgroundZone");

  zone.innerHTML = `
    <div class="playground">
      <div>
        <span class="panel-label">Parametro — ${escapeHtml(activeCategory.param)}</span>
        <div class="field" style="margin-bottom:12px">
          <input type="text" id="paramInput" placeholder="${escapeHtml(activeCategory.placeholder)}">
        </div>
        <span class="panel-label">Endpoint</span>
        <div class="endpoint-row" id="endpointRow">${escapeHtml(buildEndpointUrl(orbitUser.api_key, ""))}</div>
        <div class="copy-row">
          <button class="btn btn-ghost" id="copyEndpointBtn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/></svg>
            Copiar endpoint
          </button>
        </div>
      </div>
      <div>
        <span class="panel-label">Respuesta en vivo</span>
        <div class="json-console" id="jsonConsole">Escribe algo para ver la respuesta...</div>
        <div class="copy-row">
          <button class="btn btn-ghost" id="copyJsonBtn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/></svg>
            Copiar JSON
          </button>
        </div>
      </div>
    </div>
  `;

  const paramInput = document.getElementById("paramInput");
  const endpointRow = document.getElementById("endpointRow");
  const jsonConsole = document.getElementById("jsonConsole");

  paramInput.addEventListener("input", () => {
    const url = buildEndpointUrl(orbitUser.api_key, paramInput.value);
    endpointRow.textContent = url;

    clearTimeout(liveTimer);
    liveTimer = setTimeout(async () => {
      if (!paramInput.value) {
        jsonConsole.textContent = "Escribe algo para ver la respuesta...";
        return;
      }
      const res = await fetch(url);
      const json = await res.json().catch(() => ({ error: "Respuesta invalida" }));
      jsonConsole.textContent = JSON.stringify(json, null, 2);
      refreshStats();
    }, 450);
  });

  document.getElementById("copyEndpointBtn").addEventListener("click", () => {
    copyToClipboard(endpointRow.textContent, "Endpoint");
  });

  document.getElementById("copyJsonBtn").addEventListener("click", () => {
    copyToClipboard(jsonConsole.textContent, "JSON");
  });
}

async function refreshStats() {
  const { status, data } = await orbitFetch("/api/auth/me");
  if (status !== 200 || !data.ok) return;
  orbitUser = data.user;
  document.getElementById("statRemaining").textContent = orbitUser.requests_remaining;
  document.getElementById("statLimit").textContent = orbitUser.requests_limit;
  document.getElementById("statKey").textContent = orbitUser.api_key;
}

(async () => {
  const user = await initShell("dashboard");
  if (!user) return;

  document.getElementById("statRemaining").textContent = user.requests_remaining;
  document.getElementById("statLimit").textContent = user.requests_limit;
  document.getElementById("statKey").textContent = user.api_key;

  renderCategoryList("");
  renderPlayground();

  document.getElementById("categorySearch").addEventListener("input", (e) => {
    renderCategoryList(e.target.value);
  });
})();
