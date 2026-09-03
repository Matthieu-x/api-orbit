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
  return `${window.location.origin}${activeCategory.path}?${params.toString()}`;
}

function renderPlayground() {
  const zone = document.getElementById("playgroundZone");

  zone.innerHTML = `
    <div class="playground">
      <div>
        <span class="panel-label">Parametro — ${escapeHtml(activeCategory.param)}</span>
        <div class="field" style="margin-bottom:12px">
          <input type="text" id="paramInput" placeholder="${escapeHtml(activeCategory.placeholder)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" name="orbit-param-${escapeHtml(activeCategory.id)}">
        </div>
        <span class="panel-label">Endpoint</span>
        <div class="endpoint-row" id="endpointRow">${escapeHtml(buildEndpointUrl(orbitUser.api_key, ""))}</div>
        <div class="copy-row">
          <button class="btn btn-ghost" id="copyEndpointBtn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/></svg>
            Copiar endpoint
          </button>
          <button class="btn btn-primary" id="sendRequestBtn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7Z"/></svg>
            Enviar solicitud
          </button>
        </div>
      </div>
      <div>
        <span class="panel-label">Respuesta</span>
        <div class="json-console" id="jsonConsole">Escribe un valor y presiona "Enviar solicitud"...</div>
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
  const sendBtn = document.getElementById("sendRequestBtn");

  paramInput.addEventListener("input", () => {
    endpointRow.textContent = buildEndpointUrl(orbitUser.api_key, paramInput.value);
  });

  paramInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendBtn.click();
    }
  });

  sendBtn.addEventListener("click", async () => {
    const url = buildEndpointUrl(orbitUser.api_key, paramInput.value);
    endpointRow.textContent = url;

    sendBtn.disabled = true;
    jsonConsole.textContent = "Enviando solicitud...";

    try {
      const res = await fetch(url);
      const json = await res.json().catch(() => ({ error: "Respuesta invalida" }));
      jsonConsole.textContent = JSON.stringify(json, null, 2);
      await refreshStats();
    } catch (err) {
      jsonConsole.textContent = "No se pudo contactar el endpoint";
    }

    sendBtn.disabled = false;
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
}

(async () => {
  const user = await initShell("endpoints");
  if (!user) return;

  renderCategoryList("");
  renderPlayground();

  document.getElementById("categorySearch").addEventListener("input", (e) => {
    renderCategoryList(e.target.value);
  });
})();
