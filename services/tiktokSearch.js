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
 * que ya usa services/tiktok.js para descargas), que sí resuelve la
 * firma anti-bot de TikTok en vez de simularla al azar.
 */
async function searchTikTok(query, limit = 10) {
  const videos = [];
  let page = 1;
  const maxPages = 3;

  while (videos.length < limit && page <= maxPages) {
    let result;
    try {
      result = await Tiktok.Search(query, { type: "video", page });
    } catch (error) {
      console.error(`Error buscando en TikTok (página ${page}):`, error.message);
      break;
    }

    if (result?.status !== "success" || !Array.isArray(result.result) || result.result.length === 0) {
      break;
    }

    for (const item of result.result) {
      if (item && item.id) videos.push(mapVideo(item));
      if (videos.length >= limit) break;
    }

    if (result.result.length < 1) break;
    page += 1;
  }

  return videos.slice(0, limit);
}

module.exports = {
  searchTikTok
};
