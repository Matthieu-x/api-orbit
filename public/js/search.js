let searchUser;

function searchUrl() {
  const q = document.getElementById("queryInput").value;

  return `${location.origin}/api/v1/search?apikey=${encodeURIComponent(
    searchUser.api_key
  )}&query=${encodeURIComponent(q)}`;
}

function update() {
  document.getElementById("endpointUrl").textContent = searchUrl();
}

function pinterestUrl() {
  const q = document.getElementById("pinterestQueryInput").value;

  return `${location.origin}/api/v1/pinterest?apikey=${encodeURIComponent(
    searchUser.api_key
  )}&query=${encodeURIComponent(q)}`;
}

function pinterestUpdate() {
  document.getElementById("pinterestEndpointUrl").textContent =
    pinterestUrl();
}

function tiktokUrl() {
  const q = document.getElementById("tiktokQueryInput").value;

  return `${location.origin}/api/v1/tiktok-search?apikey=${encodeURIComponent(
    searchUser.api_key
  )}&query=${encodeURIComponent(q)}`;
}

function tiktokUpdate() {
  document.getElementById("tiktokEndpointUrl").textContent =
    tiktokUrl();
}

function stickerSearchUrl() {
  const q = document.getElementById("stickerSearchQueryInput").value;

  return `${location.origin}/api/v1/sticker-search?apikey=${encodeURIComponent(
    searchUser.api_key
  )}&query=${encodeURIComponent(q)}`;
}

function stickerSearchUpdate() {
  document.getElementById("stickerSearchEndpointUrl").textContent =
    stickerSearchUrl();
}

function animeSearchUrl() {
  const q = document.getElementById("animeSearchQueryInput").value;

  return `${location.origin}/api/v1/anime/search?apikey=${encodeURIComponent(
    searchUser.api_key
  )}&query=${encodeURIComponent(q)}`;
}

function animeSearchUpdate() {
  document.getElementById("animeSearchEndpointUrl").textContent =
    animeSearchUrl();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

(async () => {
  searchUser = await initShell("search");

  if (!searchUser) return;

  const input = document.getElementById("queryInput");

  update();

  input.addEventListener("input", update);

  document.getElementById("copyBtn").onclick = () => {
    copyToClipboard(searchUrl(), "Endpoint");
  };

  document.getElementById("sendBtn").onclick = async () => {
    if (!input.value.trim()) {
      return showToast("Escribe una búsqueda");
    }

    const out = document.getElementById("response");
    const btn = document.getElementById("sendBtn");

    btn.disabled = true;

    out.innerHTML =
      '<div class="json-console-loading"><span class="orbit-spinner"></span>Buscando...</div>';

    try {
      const r = await fetch(searchUrl(), {
        headers: {
          "x-orbit-ip": searchUser.orbit_ip || ""
        }
      });

      const data = await r.json();

      out.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      out.textContent = "No se pudo contactar el endpoint";
    } finally {
      btn.disabled = false;
    }
  };

  const pinterestInput = document.getElementById(
    "pinterestQueryInput"
  );

  pinterestUpdate();

  pinterestInput.addEventListener("input", pinterestUpdate);

  document.getElementById("pinterestCopyBtn").onclick = () => {
    copyToClipboard(pinterestUrl(), "Endpoint");
  };

  document.getElementById("pinterestSendBtn").onclick = async () => {
    if (!pinterestInput.value.trim()) {
      return showToast("Escribe una búsqueda");
    }

    const out = document.getElementById("pinterestResponse");
    const btn = document.getElementById("pinterestSendBtn");

    btn.disabled = true;

    out.innerHTML =
      '<div class="json-console-loading"><span class="orbit-spinner"></span>Buscando en Pinterest...</div>';

    try {
      const r = await fetch(pinterestUrl(), {
        headers: {
          "x-orbit-ip": searchUser.orbit_ip || ""
        }
      });

      const data = await r.json();

      out.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      out.textContent = "No se pudo contactar el endpoint";
    } finally {
      btn.disabled = false;
    }
  };

  const tiktokInput = document.getElementById(
    "tiktokQueryInput"
  );

  tiktokUpdate();

  tiktokInput.addEventListener("input", tiktokUpdate);

  document.getElementById("tiktokCopyBtn").onclick = () => {
    copyToClipboard(tiktokUrl(), "Endpoint");
  };

  document.getElementById("tiktokSendBtn").onclick = async () => {
    if (!tiktokInput.value.trim()) {
      return showToast("Escribe una búsqueda");
    }

    const out = document.getElementById("tiktokResponse");
    const btn = document.getElementById("tiktokSendBtn");

    btn.disabled = true;

    out.innerHTML =
      '<div class="json-console-loading"><span class="orbit-spinner"></span>Buscando en TikTok...</div>';

    try {
      const r = await fetch(tiktokUrl(), {
        headers: {
          "x-orbit-ip": searchUser.orbit_ip || ""
        }
      });

      const data = await r.json();

      out.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      out.textContent = "No se pudo contactar el endpoint";
    } finally {
      btn.disabled = false;
    }
  };

  const stickerSearchInput = document.getElementById(
    "stickerSearchQueryInput"
  );

  stickerSearchUpdate();

  stickerSearchInput.addEventListener(
    "input",
    stickerSearchUpdate
  );

  document.getElementById("stickerSearchCopyBtn").onclick = () => {
    copyToClipboard(stickerSearchUrl(), "Endpoint");
  };

  document.getElementById("stickerSearchSendBtn").onclick = async () => {
    if (!stickerSearchInput.value.trim()) {
      return showToast("Escribe una búsqueda");
    }

    const out = document.getElementById("stickerSearchResult");
    const btn = document.getElementById("stickerSearchSendBtn");

    btn.disabled = true;

    out.innerHTML =
      '<div class="json-console-loading"><span class="orbit-spinner"></span>Buscando stickers...</div>';

    try {
      const r = await fetch(stickerSearchUrl(), {
        headers: {
          "x-orbit-ip": searchUser.orbit_ip || ""
        }
      });

      const data = await r.json();

      out.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      out.textContent = "No se pudo contactar el endpoint";
    } finally {
      btn.disabled = false;
    }
  };

  const animeSearchInput = document.getElementById("animeSearchQueryInput");

  animeSearchUpdate();

  animeSearchInput.addEventListener("input", animeSearchUpdate);

  document.getElementById("animeSearchCopyBtn").onclick = () => {
    copyToClipboard(animeSearchUrl(), "Endpoint");
  };

  document.getElementById("animeSearchSendBtn").onclick = async () => {
    if (!animeSearchInput.value.trim()) {
      return showToast("Escribe el nombre de un anime");
    }

    const out = document.getElementById("animeSearchResult");
    const btn = document.getElementById("animeSearchSendBtn");

    btn.disabled = true;

    out.innerHTML =
      '<div class="json-console-loading"><span class="orbit-spinner"></span>Buscando...</div>';

    try {
      const r = await fetch(animeSearchUrl(), {
        headers: {
          "x-orbit-ip": searchUser.orbit_ip || ""
        }
      });

      const data = await r.json();

      if (!data.status || !Array.isArray(data.result) || data.result.length === 0) {
        out.textContent = JSON.stringify(data, null, 2);
        return;
      }

      out.innerHTML = data.result
        .map(
          (item, i) => `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 0;${i === 0 ? "" : "border-top:1px solid var(--border)"}">
            <span style="font-size:13px">${escapeHtml(item.title)}</span>
            <button type="button" class="btn btn-ghost" data-copy-link="${escapeHtml(item.link)}" style="flex:0 0 auto;height:30px;padding:0 10px;font-size:12px">Copiar link</button>
          </div>`
        )
        .join("");

      out.querySelectorAll("[data-copy-link]").forEach((copyBtnEl) => {
        copyBtnEl.addEventListener("click", () => {
          copyToClipboard(copyBtnEl.dataset.copyLink, "Link");
          showToast("Pégalo en Anime Episodes (página Anime)");
        });
      });
    } catch (e) {
      out.textContent = "No se pudo contactar el endpoint";
    } finally {
      btn.disabled = false;
    }
  };
})();