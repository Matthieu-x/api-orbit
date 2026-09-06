const axios = require("axios");
const crypto = require("crypto");

const KY = process.env.SAVETUBE_KEY || "C5D58EF67A7584E4A29F6C35BBC4EB12";
const YT_REGEX = /^((?:https?:)?\/\/)?((?:www|m|music)\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(?:embed\/)?(?:v\/)?(?:shorts\/)?([a-zA-Z0-9_-]{11})/;

const http = axios.create({
  headers: {
    "content-type": "application/json",
    origin: "https://yt.savetube.me",
    referer: "https://yt.savetube.me/",
    "user-agent": "Mozilla/5.0 (Android 15; Mobile; SM-F958; rv:130.0) Gecko/130.0 Firefox/130.0"
  },
  timeout: 15000
});

let cdnCache = null;
let cdnCacheExpiry = 0;

function extractId(url) {
  return String(url || "").match(YT_REGEX)?.[3] || null;
}

async function decrypt(enc) {
  const sr = Buffer.from(enc, "base64");
  const ky = Buffer.from(KY, "hex");
  const iv = sr.slice(0, 16);
  const dt = sr.slice(16);
  const dc = crypto.createDecipheriv("aes-128-cbc", ky, iv);
  return JSON.parse(Buffer.concat([dc.update(dt), dc.final()]).toString());
}

async function getCdn(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cdnCache && now < cdnCacheExpiry) return cdnCache;
  const response = await http.get("https://media.savetube.vip/api/random-cdn");
  cdnCache = response.data.cdn;
  cdnCacheExpiry = now + 5 * 60 * 1000;
  return cdnCache;
}

async function fetchInfo(id, forceRefreshCdn = false) {
  const cdn = await getCdn(forceRefreshCdn);
  const response = await http.post(`https://${cdn}/v2/info`, {
    url: `https://www.youtube.com/watch?v=${id}`
  });
  return { cdn, data: await decrypt(response.data.data) };
}

async function downloadVideo(url, quality) {
  const id = extractId(url);
  if (!id) return { status: false, code: 400, error: "URL de YouTube no válida" };

  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { cdn, data } = await fetchInfo(id, attempt === 1);
      const response = await http.post(`https://${cdn}/download`, {
        id,
        downloadType: "video",
        quality,
        key: data.key
      });
      return {
        status: true,
        title: data.title,
        duration: data.duration,
        thumbnail: data.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        quality: `${quality}p`,
        format: "MP4",
        download_url: response.data.data.downloadUrl
      };
    } catch (error) {
      lastError = error;
      cdnCache = null;
    }
  }
  return { status: false, code: 500, error: lastError?.response?.data?.message || lastError?.message || "No se pudo procesar el video" };
}

async function downloadAudio(url) {
  const id = extractId(url);
  if (!id) return { status: false, code: 400, error: "URL de YouTube no válida" };

  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { cdn, data } = await fetchInfo(id, attempt === 1);
      const response = await http.post(`https://${cdn}/download`, {
        id,
        downloadType: "audio",
        quality: "128",
        key: data.key
      });
      return {
        status: true,
        title: data.title,
        format: "mp3",
        thumbnail: data.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        duration: data.duration,
        download_url: response.data.data.downloadUrl
      };
    } catch (error) {
      lastError = error;
      cdnCache = null;
    }
  }
  return { status: false, code: 500, error: lastError?.response?.data?.message || lastError?.message || "No se pudo procesar el audio" };
}

module.exports = { extractId, downloadVideo, downloadAudio };
