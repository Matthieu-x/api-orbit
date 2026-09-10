let searchUser;

function searchUrl() {
  const q = document.getElementById("queryInput").value;
  return `${location.origin}/api/v1/search?apikey=${encodeURIComponent(searchUser.api_key)}&query=${encodeURIComponent(q)}`;
}

function update() {
  document.getElementById("endpointUrl").textContent = searchUrl();
}

function pinterestUrl() {
  const q = document.getElementById("pinterestQueryInput").value;
  return `${location.origin}/api/v1/pinterest?apikey=${encodeURIComponent(searchUser.api_key)}&query=${encodeURIComponent(q)}`;
}

function pinterestUpdate() {
  document.getElementById("pinterestEndpointUrl").textContent = pinterestUrl();
}

function tiktokUrl() {
  const q = document.getElementById("tiktokQueryInput").value;
  return `${location.origin}/api/v1/tiktok-search?apikey=${encodeURIComponent(searchUser.api_key)}&query=${encodeURIComponent(q)}`;
}

function tiktokUpdate() {
  document.getElementById("tiktokEndpointUrl").textContent = tiktokUrl();
}

function stickerSearchUrl() {
  const q = document.getElementById("stickerSearchQueryInput").value;
  return `${location.origin}/api/v1/sticker-search?apikey=${encodeURIComponent(searchUser.api_key)}&query=${encodeURIComponent(q)}`;
}

function stickerSearchUpdate() {
  document.getElementById("stickerSearchEndpointUrl").textContent = stickerSearchUrl();
}

(async () => {
  searchUser = await initShell("search");

  if (!searchUser) return;

  const input = document.getElementById("queryInput");
  const pinterestInput = document.getElementById("pinterestQueryInput");
  const tiktokInput = document.getElementById("tiktokQueryInput");
  const stickerSearchInput = document.getElementById("stickerSearchQueryInput");

  update();
  pinterestUpdate();
  tiktokUpdate();
  stickerSearchUpdate();

  input.addEventListener("input", update);
  pinterestInput.addEventListener("input", pinterestUpdate);
  tiktokInput.addEventListener("input", tiktokUpdate);
  stickerSearchInput.addEventListener("input", stickerSearchUpdate);

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
      out.textContent = JSON.stringify(
        {
          status: false,
          error: "No se pudo contactar el endpoint"
        },
        null,
        2
      );
    } finally {
      btn.disabled = false;
    }
  };

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
      out.textContent = JSON.stringify(
        {
          status: false,
          error: "No se pudo contactar el endpoint"
        },
        null,
        2
      );
    } finally {
      btn.disabled = false;
    }
  };

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
      out.textContent = JSON.stringify(
        {
          status: false,
          error: "No se pudo contactar el endpoint"
        },
        null,
        2
      );
    } finally {
      btn.disabled = false;
    }
  };

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

      /*
       * IMPORTANTE:
       * Aquí NO se crean imágenes.
       * La respuesta completa se muestra como JSON.
       */
      out.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      out.textContent = JSON.stringify(
        {
          status: false,
          error: "No se pudo contactar el endpoint"
        },
        null,
        2
      );
    } finally {
      btn.disabled = false;
    }
  };
})();