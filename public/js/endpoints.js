const CATEGORIES = [
  {
    id: "busqueda",
    name: "Búsqueda",
    description: "Herramientas para realizar búsquedas.",
    endpoints: [
      {
        id: "youtube-search",
        name: "YouTube Search",
        method: "GET",
        path: "/api/v1/busqueda",
        param: "query",
        placeholder: "Ej: música electrónica",
        description: "Busca videos de YouTube y devuelve sus datos principales."
      }
    ]
  }
];

let activeCategory = CATEGORIES[0];
let activeEndpoint = CATEGORIES[0]?.endpoints[0] || null;

function renderCategoryList(filter = "") {
  const query = filter.trim().toLowerCase();
  const container = document.getElementById("categoryList");

  const categories = CATEGORIES.map((category) => ({
    ...category,
    endpoints: category.endpoints.filter((endpoint) => {
      if (!query) return true;
      return [category.name, category.description, endpoint.name, endpoint.path, endpoint.description]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
  })).filter((category) => category.endpoints.length > 0);

  if (categories.length === 0) {
    container.innerHTML = '<p class="muted" style="padding:10px 4px">Sin resultados para tu búsqueda</p>';
    return;
  }

  container.innerHTML = categories.map((category) => `
    <section class="endpoint-category ${activeCategory?.id === category.id ? "active" : ""}">
      <button class="category-head" type="button" data-category-id="${escapeHtml(category.id)}" aria-expanded="${activeCategory?.id === category.id}">
        <span>
          <strong>${escapeHtml(category.name)}</strong>
          <small>${escapeHtml(category.description)}</small>
        </span>
        <svg class="category-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="endpoint-list ${activeCategory?.id === category.id ? "open" : ""}">
        ${category.endpoints.map((endpoint) => `
          <button class="endpoint-item ${activeEndpoint?.id === endpoint.id ? "active" : ""}" type="button" data-endpoint-id="${escapeHtml(endpoint.id)}">
            <span class="method">${escapeHtml(endpoint.method)}</span>
            <span class="endpoint-item-main">
              <strong>${escapeHtml(endpoint.name)}</strong>
              <small>${escapeHtml(endpoint.path)}</small>
            </span>
          </button>
        `).join("")}
      </div>
    </section>
  `).join("");

  container.querySelectorAll(".category-head").forEach((button) => {
    button.addEventListener("click", () => {
      const category = CATEGORIES.find((item) => item.id === button.dataset.categoryId);
      if (!category) return;
      activeCategory = category;
      if (!category.endpoints.some((endpoint) => endpoint.id === activeEndpoint?.id)) {
        activeEndpoint = category.endpoints[0] || null;
      }
      renderCategoryList(document.getElementById("categorySearch").value);
      renderPlayground();
    });
  });

  container.querySelectorAll(".endpoint-item").forEach((button) => {
    button.addEventListener("click", () => {
      const endpoint = activeCategory.endpoints.find((item) => item.id === button.dataset.endpointId);
      if (!endpoint) return;
      activeEndpoint = endpoint;
      renderCategoryList(document.getElementById("categorySearch").value);
      renderPlayground();
    });
  });
}

function buildEndpointUrl(apiKey, value) {
  const params = new URLSearchParams();
  params.set("apikey", apiKey);
  params.set(activeEndpoint.param, value || "");
  return `${window.location.origin}${activeEndpoint.path}?${params.toString()}`;
}

function renderPlayground() {
  const zone = document.getElementById("playgroundZone");

  if (!activeEndpoint) {
    zone.innerHTML = '<div class="notif-empty">Selecciona un endpoint para comenzar.</div>';
    return;
  }

  zone.innerHTML = `
    <div class="playground">
      <div>
        <div class="playground-title-row">
          <div>
            <span class="panel-label">${escapeHtml(activeEndpoint.method)} · ${escapeHtml(activeEndpoint.name)}</span>
            <p class="muted playground-description">${escapeHtml(activeEndpoint.description)}</p>
          </div>
        </div>
        <span class="panel-label">Parámetro — ${escapeHtml(activeEndpoint.param)}</span>
        <div class="field" style="margin-bottom:12px">
          <input type="text" id="paramInput" placeholder="${escapeHtml(activeEndpoint.placeholder)}" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" name="orbit-param-${escapeHtml(activeEndpoint.id)}">
        </div>
        <span class="panel-label">Endpoint</span>
        <div class="endpoint-row" id="endpointRow">${escapeHtml(buildEndpointUrl(orbitUser.api_key, ""))}</div>
        <div class="copy-row">
          <button class="btn btn-ghost" id="copyEndpointBtn" type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/></svg>
            Copiar endpoint
          </button>
          <button class="btn btn-primary" id="sendRequestBtn" type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7Z"/></svg>
            Enviar solicitud
          </button>
        </div>
      </div>
      <div>
        <span class="panel-label">Respuesta</span>
        <div class="json-console" id="jsonConsole">Escribe un valor y presiona "Enviar solicitud"...</div>
        <div class="copy-row">
          <button class="btn btn-ghost" id="copyJsonBtn" type="button">
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
    const value = paramInput.value.trim();
    if (!value) {
      showToast(`Escribe un valor para ${activeEndpoint.param}`);
      paramInput.focus();
      return;
    }

    const url = buildEndpointUrl(orbitUser.api_key, value);
    endpointRow.textContent = url;

    sendBtn.disabled = true;
    jsonConsole.textContent = "Enviando solicitud...";

    try {
      const res = await fetch(url);
      const json = await res.json().catch(() => ({ ok: false, error: "Respuesta inválida" }));
      jsonConsole.textContent = JSON.stringify(json, null, 2);
      await refreshStats();
    } catch (err) {
      jsonConsole.textContent = "No se pudo contactar el endpoint";
    } finally {
      sendBtn.disabled = false;
    }
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
