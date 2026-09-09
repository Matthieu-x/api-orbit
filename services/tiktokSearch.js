// services/tiktokSearch.js
const Tiktok = require("@tobyg74/tiktok-api-dl");

function mapVideo(v) {
  return {
    id: v.id,
    desc: v.desc || "",
    createTime: v.createTime || null,
    video: {
      cover: v.video?.cover || v.video?.originCover || v.video?.dynamicCover || null,
      duration: v.video?.duration || 0,
      play: v.video?.playAddr || null,
      download: v.video?.downloadAddr || null,
      ratio: v.video?.ratio || null
    },
    author: {
      id: v.author?.id || null,
      uniqueId: v.author?.uniqueId || null,
      nickname: v.author?.nickname || null,
      avatar: v.author?.avatarThumb || v.author?.avatarMedium || v.author?.avatarLarger || null,
      verified: v.author?.verified || false,
      signature: v.author?.signature || null
    },
    stats: {
      diggCount: v.stats?.likeCount || v.stats?.diggCount || 0,
      shareCount: v.stats?.shareCount || 0,
      commentCount: v.stats?.commentCount || 0,
      playCount: v.stats?.playCount || 0
    },
    music: v.music
      ? {
          id: v.music.id || null,
          title: v.music.title || null,
          playUrl: v.music.playUrl || null,
          cover: v.music.coverThumb || v.music.coverMedium || v.music.coverLarge || null,
          authorName: v.music.authorName || null
        }
      : null,
    url: `https://www.tiktok.com/@${v.author?.uniqueId || "user"}/video/${v.id}`
  };
}

/**
 * Busca videos en TikTok usando @tobyg74/tiktok-api-dl (misma librería
 * que ya usa services/tiktok.js para descargas).
 *
 * Devuelve { videos, debug }. `debug` solo se llena cuando la búsqueda
 * termina vacía, con el motivo real (status/mensaje de la librería o la
 * excepción), para no volver a adivinar a ciegas si vuelve a fallar.
 */
async function searchTikTok(query, limit = 10) {
  const videos = [];
  let page = 1;
  const maxPages = 3;
  let debug = null;

  while (videos.length < limit && page <= maxPages) {
    let result;
    try {
      result = await Tiktok.Search(query, { type: "video", page });
    } catch (error) {
      debug = `Excepción en página ${page}: ${error.message}`;
      console.error(`[tiktokSearch] ${debug}`);
      break;
    }

    console.log(`[tiktokSearch] página ${page} -> status=${result?.status} items=${Array.isArray(result?.result) ? result.result.length : "n/a"} message=${result?.message || "-"}`);

    if (result?.status !== "success") {
      debug = `La librería respondió status="${result?.status}"${result?.message ? ` con mensaje: ${result.message}` : " sin mensaje de error"}.`;
      break;
    }

    if (!Array.isArray(result.result) || result.result.length === 0) {
      debug = `La librería respondió status="success" pero sin videos en la página ${page} (posible bloqueo silencioso o falta de cookie).`;
      break;
    }

    for (const item of result.result) {
      if (item && item.id) videos.push(mapVideo(item));
      if (videos.length >= limit) break;
    }

    page += 1;
  }

  return { videos: videos.slice(0, limit), debug: videos.length === 0 ? debug : null };
}

module.exports = {
  searchTikTok
};
