const axios = require("axios");

const TIKTOK_API_URL = "https://api.lempi.lat/s/tiktok";
const TIKTOK_API_KEY = "lem_b3c37229eb1597b655ebf09727367d1f35af0486";

function mapVideo(v) {
  return {
    id: v.id || null,
    desc: v.titulo || "",
    createTime: v.publicado || null,
    video: {
      cover: v.autor?.avatar || null,
      duration: v.duracion || 0,
      play: v.video || null,
      download: v.video || null,
      ratio: v.calidad || null
    },
    author: {
      id: null,
      uniqueId: v.autor?.usuario || null,
      nickname: v.autor?.nombre || null,
      avatar: v.autor?.avatar || null,
      verified: v.autor?.verificado || false,
      signature: null
    },
    stats: {
      diggCount: v.estadisticas?.likes || 0,
      shareCount: v.estadisticas?.compartidos || 0,
      commentCount: v.estadisticas?.comentarios || 0,
      playCount: v.estadisticas?.vistas || 0,
      favoriteCount: v.estadisticas?.favoritos || 0
    },
    music: v.musica
      ? {
          id: null,
          title: v.musica.titulo || null,
          playUrl: v.musica.url || null,
          cover: null,
          authorName: v.musica.autor || null
        }
      : null,
    url: v.url || null
  };
}

async function searchTikTok(query, limit = 10) {
  try {
    const response = await axios.get(TIKTOK_API_URL, {
      params: {
        q: query,
        apikey: TIKTOK_API_KEY
      },
      timeout: 30000
    });

    const data = response.data;

    console.log(
      `[tiktokSearch] status=${data?.status} total=${data?.total ?? 0}`
    );

    if (!data?.status) {
      return {
        videos: [],
        debug: data?.error || "La API de TikTok respondió con error."
      };
    }

    if (!Array.isArray(data.resultados) || data.resultados.length === 0) {
      return {
        videos: [],
        debug: "No se encontraron resultados."
      };
    }

    const videos = data.resultados
      .slice(0, limit)
      .map(mapVideo)
      .filter(video => video.id);

    return {
      videos,
      debug: videos.length
        ? null
        : "No se encontraron resultados."
    };

  } catch (error) {
    console.error(
      `[tiktokSearch] ${error.response?.data?.error || error.message}`
    );

    return {
      videos: [],
      debug:
        error.response?.data?.error ||
        error.message ||
        "Error consultando la API de TikTok."
    };
  }
}

module.exports = {
  searchTikTok
};