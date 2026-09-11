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
}

function requireVip() {
  if (downloadUser.is_vip || downloadUser.is_admin) return true;
  showToast("Este endpoint requiere VIP");
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
  if (type === "ytvideo" && !requireVip()) return;

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
  if (!requireVip()) return;
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
  if (!requireVip()) return;
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
  if (!requireVip()) return;
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
    "fdroidQuery"
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

  if (!downloadUser.is_vip && !downloadUser.is_admin) {
    $("videoResponse").textContent = "Este endpoint requiere VIP. Ve a /vip para activar tu plan.";
    $("aptoideResponse").textContent = "Este endpoint requiere VIP. Ve a /vip para activar tu plan.";
    $("fdroidResponse").textContent = "Este endpoint requiere VIP. Ve a /vip para activar tu plan.";
  }
})();