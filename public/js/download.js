let downloadUser;

const $ = id => document.getElementById(id);

function apiUrl(type, params = {}) {
  const base = `${location.origin}/api/v1/download/${type}`;
  const search = new URLSearchParams({
    apikey: downloadUser.api_key,
    ...params
  });
  return `${base}?${search.toString()}`;
}

function makeUrl(type) {
  if (type === "ytaudio") {
    return apiUrl("ytaudio", { url: $("audioUrl").value });
  }

  if (type === "ytvideo") {
    return apiUrl("ytvideo", {
      url: $("videoUrl").value,
      quality: $("videoQuality").value
    });
  }

  if (type === "tiktok") {
    return apiUrl("tiktok", { url: $("tiktokUrl").value });
  }

  if (type === "aptoide") {
    return apiUrl("aptoide", {
      query: $("aptoideQuery").value,
      index: $("aptoideIndex").value || 0
    });
  }

  if (type === "fdroid") {
    return apiUrl("fdroid", {
      query: $("fdroidQuery").value
    });
  }
}

function refreshUrls() {
  $("audioEndpoint").textContent = makeUrl("ytaudio");
  $("videoEndpoint").textContent = makeUrl("ytvideo");
  $("tiktokEndpoint").textContent = makeUrl("tiktok");
  $("aptoideEndpoint").textContent = makeUrl("aptoide");
  $("fdroidEndpoint").textContent = makeUrl("fdroid");
  $("appleMusicEndpoint").textContent = apiUrl("applemusic", { url: $("appleMusicUrl").value });
  $("spotifyDlEndpoint").textContent = apiUrl("spotifydl", { url: $("spotifyDlUrl").value });
}

// Mismo orden de tiers que utils/plans.js en el backend.
const PLAN_RANK = { free: 0, basic: 1, plus: 2, vip: 3, superorbit: 4 };

function hasMinPlan(minPlan) {
  if (downloadUser.is_admin) return true;
  return (PLAN_RANK[downloadUser.plan] || 0) >= PLAN_RANK[minPlan];
}

function requirePlan(minPlan, label) {
  if (hasMinPlan(minPlan)) return true;
  showToast(`Este endpoint requiere el plan ${label} o superior`);
  return false;
}

async function run(type) {
  const idMap = {
    ytaudio: ["audioUrl", "audioResponse", "audioSend"],
    ytvideo: ["videoUrl", "videoResponse", "videoSend"],
    tiktok: ["tiktokUrl", "tiktokResponse", "tiktokSend"]
  };

  const [inputId, outId, btnId] = idMap[type];
  const input = $(inputId);
  const out = $(outId);
  const btn = $(btnId);

  if (!input.value.trim()) return showToast("Escribe una URL");
  if (type === "ytvideo" && !requirePlan("plus", "Plus")) return;

  btn.disabled = true;
  const labels = {
    ytaudio: "Descargando audio...",
    ytvideo: "Descargando video...",
    tiktok: "Descargando de TikTok..."
  };

  out.innerHTML = `<div class="json-console-loading"><span class="orbit-spinner"></span>${labels[type]}</div>`;

  try {
    const r = await fetch(makeUrl(type), { headers: { "x-orbit-ip": downloadUser.orbit_ip || "" } });
    const text = await r.text();
    try {
      out.textContent = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      out.textContent = text || `HTTP ${r.status}`;
    }
  } catch {
    out.textContent = "No se pudo contactar el endpoint";
  } finally {
    btn.disabled = false;
  }
}

async function runAptoideSearch() {
  if (!requirePlan("vip", "VIP")) return;
  const query = $("aptoideQuery").value.trim();
  if (!query) return showToast("Escribe una aplicación");

  const out = $("aptoideResponse");
  out.innerHTML = `<div class="json-console-loading"><span class="orbit-spinner"></span>Buscando en Aptoide...</div>`;

  try {
    const r = await fetch(makeUrl("aptoide"), { headers: { "x-orbit-ip": downloadUser.orbit_ip || "" } });
    const data = await r.json();
    out.textContent = JSON.stringify(data, null, 2);
  } catch {
    out.textContent = "No se pudo contactar Aptoide";
  }
}

async function runFdroidSearch() {
  if (!requirePlan("vip", "VIP")) return;
  const query = $("fdroidQuery").value.trim();
  if (!query) return showToast("Escribe una aplicación o package");

  const out = $("fdroidResponse");
  out.innerHTML = `<div class="json-console-loading"><span class="orbit-spinner"></span>Buscando en F-Droid...</div>`;

  try {
    const r = await fetch(makeUrl("fdroid"), { headers: { "x-orbit-ip": downloadUser.orbit_ip || "" } });
    const data = await r.json();
    out.textContent = JSON.stringify(data, null, 2);
  } catch {
    out.textContent = "No se pudo contactar F-Droid";
  }
}

function openDownload(type, params) {
  if (!requirePlan("vip", "VIP")) return;
  const url = apiUrl(type, params);
  window.open(url, "_blank", "noopener,noreferrer");
}

(async () => {
  downloadUser = await initShell("download");
  if (!downloadUser) return;

  refreshUrls();

  [
    "audioUrl",
    "videoUrl",
    "videoQuality",
    "tiktokUrl",
    "aptoideQuery",
    "aptoideIndex",
    "fdroidQuery",
    "appleMusicUrl",
    "spotifyDlUrl"
  ].forEach(id => $(id).addEventListener("input", refreshUrls));

  $("videoQuality").addEventListener("change", refreshUrls);

  $("audioCopy").onclick = () => copyToClipboard(makeUrl("ytaudio"), "Endpoint");
  $("videoCopy").onclick = () => copyToClipboard(makeUrl("ytvideo"), "Endpoint");
  $("tiktokCopy").onclick = () => copyToClipboard(makeUrl("tiktok"), "Endpoint");
  $("aptoideCopy").onclick = () => copyToClipboard(makeUrl("aptoide"), "Endpoint");
  $("fdroidCopy").onclick = () => copyToClipboard(makeUrl("fdroid"), "Endpoint");

  $("audioSend").onclick = () => run("ytaudio");
  $("videoSend").onclick = () => run("ytvideo");
  $("tiktokSend").onclick = () => run("tiktok");

  $("aptoideSearch").onclick = runAptoideSearch;
  $("fdroidSearch").onclick = runFdroidSearch;

  $("aptoideDownload").onclick = () => openDownload("aptoide", {
    query: $("aptoideQuery").value,
    download: "true",
    index: $("aptoideIndex").value || 0
  });

  $("fdroidDownload").onclick = () => openDownload("fdroid", {
    package: $("fdroidQuery").value,
    download: "true"
  });

  if (!hasMinPlan("plus")) {
    $("videoResponse").textContent = "Este endpoint requiere el plan Plus o superior. Ve a /vip para activar tu plan.";
    $("spotifyDlResponse").textContent = "Este endpoint requiere el plan Plus o superior. Ve a /vip para activar tu plan.";
  }
  if (!hasMinPlan("vip")) {
    $("aptoideResponse").textContent = "Este endpoint requiere el plan VIP o superior. Ve a /vip para activar tu plan.";
    $("fdroidResponse").textContent = "Este endpoint requiere el plan VIP o superior. Ve a /vip para activar tu plan.";
  }

  $("appleMusicCopy").onclick = () => copyToClipboard(apiUrl("applemusic", { url: $("appleMusicUrl").value }), "Endpoint");

  $("appleMusicSend").onclick = async () => {
    const url = $("appleMusicUrl").value.trim();
    if (!url) return showToast("Pega la url de un resultado de Apple Music Search");

    const btn = $("appleMusicSend");
    const out = $("appleMusicResponse");
    btn.disabled = true;
    out.innerHTML = '<div class="json-console-loading"><span class="orbit-spinner"></span>Obteniendo descarga...</div>';

    try {
      const r = await fetch(apiUrl("applemusic", { url }), { headers: { "x-orbit-ip": downloadUser.orbit_ip || "" } });
      const data = await r.json();
      out.textContent = JSON.stringify(data, null, 2);
    } catch {
      out.textContent = "No se pudo contactar el endpoint";
    } finally {
      btn.disabled = false;
    }
  };

  $("spotifyDlCopy").onclick = () => copyToClipboard(apiUrl("spotifydl", { url: $("spotifyDlUrl").value }), "Endpoint");

  $("spotifyDlSend").onclick = async () => {
    if (!requirePlan("plus", "Plus")) return;
    const url = $("spotifyDlUrl").value.trim();
    if (!url) return showToast("Pega la url de un resultado de Spotify Search");

    const btn = $("spotifyDlSend");
    const out = $("spotifyDlResponse");
    btn.disabled = true;
    out.innerHTML = '<div class="json-console-loading"><span class="orbit-spinner"></span>Obteniendo descarga...</div>';

    try {
      const r = await fetch(apiUrl("spotifydl", { url }), { headers: { "x-orbit-ip": downloadUser.orbit_ip || "" } });
      const data = await r.json();
      out.textContent = JSON.stringify(data, null, 2);
    } catch {
      out.textContent = "No se pudo contactar el endpoint";
    } finally {
      btn.disabled = false;
    }
  };
})();
