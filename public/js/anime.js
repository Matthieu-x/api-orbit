let animeUser;

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ── Random ──────────────────────────────────
function animeUrl() {
  const type = document.getElementById("animeType").value;
  return `${location.origin}/api/v1/anime/random?apikey=${encodeURIComponent(animeUser.api_key)}&type=${encodeURIComponent(type)}`;
}
function animeUpdate() {
  document.getElementById("animeEndpoint").textContent = animeUrl();
}

// ── Episodes ─────────────────────────────────
function animeEpisodesUrl() {
  const link = document.getElementById("animeEpisodesLink").value.trim();
  return `${location.origin}/api/v1/anime/episodes?apikey=${encodeURIComponent(animeUser.api_key)}&link=${encodeURIComponent(link)}`;
}
function animeEpisodesUpdate() {
  document.getElementById("animeEpisodesEndpoint").textContent = animeEpisodesUrl();
}

// ── Download ─────────────────────────────────
function animeDownloadUrl() {
  const episode = document.getElementById("animeDownloadEpisode").value.trim();
  return `${location.origin}/api/v1/anime/download?apikey=${encodeURIComponent(animeUser.api_key)}&episode=${encodeURIComponent(episode)}`;
}
function animeDownloadUpdate() {
  document.getElementById("animeDownloadEndpoint").textContent = animeDownloadUrl();
}

(async () => {
  animeUser = await initShell("anime");
  if (!animeUser) return;

  // ── Random ──
  const typeSelect = document.getElementById("animeType");
  animeUpdate();
  typeSelect.addEventListener("change", animeUpdate);
  document.getElementById("animeCopy").onclick = () => copyToClipboard(animeUrl(), "Endpoint");

  const animeOut = document.getElementById("animeResponse");
  const animeBtn = document.getElementById("animeSend");
  animeBtn.onclick = async () => {
    animeBtn.disabled = true;
    animeOut.innerHTML = '<div class="json-console-loading"><span class="orbit-spinner"></span>Buscando imagen...</div>';
    try {
      const r = await fetch(animeUrl(), { headers: { "x-orbit-ip": animeUser.orbit_ip || "" } });
      const data = await r.json();
      if (!data.status) {
        animeOut.textContent = JSON.stringify(data, null, 2);
      } else {
        animeOut.innerHTML =
          `<img src="${data.result}" alt="Imagen anime" style="max-width:260px;width:100%;border-radius:12px;display:block;margin:0 auto 14px">` +
          `<pre style="white-space:pre-wrap;word-break:break-all;margin:0">${JSON.stringify({ status: data.status, creator: data.creator, access: data.access, type: data.type, result: data.result }, null, 2)}</pre>`;
      }
    } catch {
      animeOut.textContent = "No se pudo contactar el endpoint";
    } finally {
      animeBtn.disabled = false;
    }
  };

  // ── Episodes ──
  const episodesLinkInput = document.getElementById("animeEpisodesLink");
  animeEpisodesUpdate();
  episodesLinkInput.addEventListener("input", animeEpisodesUpdate);
  document.getElementById("animeEpisodesCopy").onclick = () => copyToClipboard(animeEpisodesUrl(), "Endpoint");

  const episodesOut = document.getElementById("animeEpisodesResponse");
  const episodesBtn = document.getElementById("animeEpisodesSend");
  episodesBtn.onclick = async () => {
    const link = episodesLinkInput.value.trim();
    if (!link) return showToast("Pega el 'link' de un resultado de Search");

    episodesBtn.disabled = true;
    episodesOut.innerHTML = '<div class="json-console-loading"><span class="orbit-spinner"></span>Cargando episodios...</div>';

    try {
      const r = await fetch(animeEpisodesUrl(), { headers: { "x-orbit-ip": animeUser.orbit_ip || "" } });
      const data = await r.json();

      if (!data.status || !Array.isArray(data.result) || data.result.length === 0) {
        episodesOut.textContent = JSON.stringify(data, null, 2);
        return;
      }

      episodesOut.innerHTML =
        `<div style="max-height:220px;overflow-y:auto">` +
        data.result
          .map(
            (item, i) =>
              `<button type="button" class="drawer-link" data-id="${escapeHtml(item.id)}" style="width:100%;text-align:left;background:transparent;border:none;border-top:${i === 0 ? "0" : "1px solid var(--border)"};font-family:'Inter',sans-serif;font-size:13px;color:inherit;cursor:pointer;border-radius:0">
                <span>${escapeHtml(item.name)}</span>
              </button>`
          )
          .join("") +
        `</div>`;

      episodesOut.querySelectorAll("[data-id]").forEach((btnEl) => {
        btnEl.addEventListener("click", () => {
          const id = btnEl.dataset.id;
          document.getElementById("animeDownloadEpisode").value = id;
          animeDownloadUpdate();
          showToast("Episodio seleccionado — toca 'Obtener link'");
          document.getElementById("animeDownloadEpisode").scrollIntoView({ behavior: "smooth", block: "center" });
        });
      });
    } catch {
      episodesOut.textContent = "No se pudo contactar el endpoint";
    } finally {
      episodesBtn.disabled = false;
    }
  };

  // ── Download ──
  const downloadEpisodeInput = document.getElementById("animeDownloadEpisode");
  animeDownloadUpdate();
  downloadEpisodeInput.addEventListener("input", animeDownloadUpdate);
  document.getElementById("animeDownloadCopy").onclick = () => copyToClipboard(animeDownloadUrl(), "Endpoint");

  const downloadOut = document.getElementById("animeDownloadResponse");
  const downloadBtn = document.getElementById("animeDownloadSend");
  downloadBtn.onclick = async () => {
    const episode = downloadEpisodeInput.value.trim();
    if (!episode) return showToast("Pega el 'id' de un episodio");

    downloadBtn.disabled = true;
    downloadOut.innerHTML = '<div class="json-console-loading"><span class="orbit-spinner"></span>Obteniendo link...</div>';

    try {
      const r = await fetch(animeDownloadUrl(), { headers: { "x-orbit-ip": animeUser.orbit_ip || "" } });
      const data = await r.json();

      if (!data.status || !data.result) {
        downloadOut.textContent = JSON.stringify(data, null, 2);
        return;
      }

      downloadOut.innerHTML =
        `<a class="btn btn-primary btn-block" href="${escapeHtml(data.result)}" target="_blank" rel="noopener" style="margin-bottom:10px">Abrir / descargar video</a>` +
        `<pre style="white-space:pre-wrap;word-break:break-all;margin:0">${JSON.stringify(data, null, 2)}</pre>`;
    } catch {
      downloadOut.textContent = "No se pudo contactar el endpoint";
    } finally {
      downloadBtn.disabled = false;
    }
  };
})();
