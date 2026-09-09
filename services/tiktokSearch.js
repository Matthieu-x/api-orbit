// services/tiktokSearch.js
const axios = require("axios");
const cheerio = require("cheerio");

const http = axios.create({
  headers: {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "accept-language": "es-ES,es;q=0.9,en;q=0.8",
    "accept-encoding": "gzip, deflate, br",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "referer": "https://www.tiktok.com/",
    "origin": "https://www.tiktok.com"
  },
  timeout: 20000,
  maxRedirects: 5,
  validateStatus: function (status) {
    return status >= 200 && status < 400;
  }
});

/**
 * Busca videos en TikTok usando scraping HTML
 */
async function searchTikTok(query, limit = 10) {
  console.log(`Buscando en TikTok: "${query}"`);

  try {
    const searchUrl = `https://www.tiktok.com/search?q=${encodeURIComponent(query)}`;
    const response = await http.get(searchUrl);

    console.log("Respuesta recibida, status:", response.status);

    if (!response.data) {
      throw new Error("No se recibieron datos de TikTok");
    }

    const $ = cheerio.load(response.data);
    const videos = [];

    // Método 1: Buscar en SIGI_STATE (el más confiable)
    try {
      const sigiState = $('#SIGI_STATE').html();

      if (sigiState) {
        console.log("SIGI_STATE encontrado");
        const data = JSON.parse(sigiState);

        // Buscar en diferentes rutas posibles
        const videoItems =
          data?.ItemList?.video?.items ||
          data?.ItemList?.user?.items ||
          data?.ItemModule ||
          [];

        // Si es ItemModule (objeto), convertir a array
        const videoArray = Array.isArray(videoItems)
          ? videoItems
          : Object.values(videoItems);

        for (const item of videoArray.slice(0, limit)) {
          if (item && item.id) {
            videos.push(formatVideoData(item));
          }
        }
      }
    } catch (parseError) {
      console.error("Error parseando SIGI_STATE:", parseError.message);
    }

    // Método 2: Buscar en window.__INIT_PROPS__
    if (videos.length === 0) {
      try {
        const scripts = $('script');
        scripts.each((index, element) => {
          const scriptContent = $(element).html();

          if (scriptContent && scriptContent.includes('__INIT_PROPS__')) {
            const match = scriptContent.match(/window\.__INIT_PROPS__\s*=\s*({[\s\S]*?});/);

            if (match) {
              const data = JSON.parse(match[1]);
              extractVideosRecursive(data, videos, limit);
            }
          }
        });
      } catch (error) {
        console.error("Error en __INIT_PROPS__:", error.message);
      }
    }

    // Método 3: Buscar en cualquier script con datos de video
    if (videos.length === 0) {
      try {
        $('script').each((index, element) => {
          const scriptContent = $(element).html();

          if (scriptContent &&
              scriptContent.includes('"video"') &&
              scriptContent.includes('"id"') &&
              videos.length < limit) {

            try {
              // Buscar objetos JSON en el script
              const jsonMatches = scriptContent.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g) || [];

              for (const jsonStr of jsonMatches) {
                if (videos.length >= limit) break;

                try {
                  const data = JSON.parse(jsonStr);
                  extractVideosRecursive(data, videos, limit);
                } catch (e) {
                  // Ignorar JSONs inválidos
                }
              }
            } catch (error) {
              // Ignorar errores de extracción
            }
          }
        });
      } catch (error) {
        console.error("Error en búsqueda genérica:", error.message);
      }
    }

    // Método 4: Buscar en el HTML visible (último recurso)
    if (videos.length === 0) {
      try {
        $('a[href*="/video/"]').each((index, element) => {
          if (videos.length >= limit) return;

          const $element = $(element);
          const href = $element.attr('href');
          const videoId = href.match(/\/video\/(\d+)/)?.[1];

          if (videoId) {
            videos.push({
              id: videoId,
              desc: $element.find('[class*="title"], [class*="desc"]').text().trim() || 'Video de TikTok',
              video: {
                cover: $element.find('img').attr('src') || null,
                play: null
              },
              author: {
                uniqueId: $element.find('[class*="author"]').text().trim() || null,
                nickname: null,
                avatar: null
              },
              url: `https://www.tiktok.com${href}`
            });
          }
        });
      } catch (error) {
        console.error("Error en búsqueda HTML:", error.message);
      }
    }

    console.log(`Videos encontrados: ${videos.length}`);
    return videos;

  } catch (error) {
    console.error("Error en búsqueda de TikTok:", error.message);

    // Si falla con la URL normal, intentar con la URL alternativa
    try {
      return await searchTikTokAlternative(query, limit);
    } catch (fallbackError) {
      console.error("Error en búsqueda alternativa:", fallbackError.message);
      return [];
    }
  }
}

/**
 * Búsqueda alternativa usando URL diferente
 */
async function searchTikTokAlternative(query, limit = 10) {
  try {
    // Intentar con la URL de explorar
    const exploreUrl = `https://www.tiktok.com/search/video?q=${encodeURIComponent(query)}`;
    const response = await http.get(exploreUrl);

    if (!response.data) {
      throw new Error("No se recibieron datos");
    }

    const $ = cheerio.load(response.data);
    const videos = [];

    // Buscar en SIGI_STATE
    const sigiState = $('#SIGI_STATE').html();

    if (sigiState) {
      const data = JSON.parse(sigiState);
      const videoItems =
        data?.ItemList?.video?.items ||
        data?.ItemList?.user?.items ||
        data?.ItemModule ||
        [];

      const videoArray = Array.isArray(videoItems)
        ? videoItems
        : Object.values(videoItems);

      for (const item of videoArray.slice(0, limit)) {
        if (item && item.id) {
          videos.push(formatVideoData(item));
        }
      }
    }

    return videos;
  } catch (error) {
    console.error("Error en búsqueda alternativa:", error.message);
    return [];
  }
}

/**
 * Formatea los datos del video
 */
function formatVideoData(item) {
  try {
    return {
      id: item.id,
      desc: item.desc || '',
      createTime: item.createTime,
      video: {
        cover: item.video?.cover || item.video?.originCover || null,
        duration: item.video?.duration || 0,
        play: item.video?.playAddr || item.video?.downloadAddr || null,
        download: item.video?.downloadAddr || null,
        ratio: item.video?.ratio || null,
        format: item.video?.format || null
      },
      author: {
        id: item.author?.id || item.authorId || null,
        uniqueId: item.author?.uniqueId || null,
        nickname: item.author?.nickname || null,
        avatar: item.author?.avatarThumb || item.author?.avatarMedium || null,
        verified: item.author?.verified || false
      },
      stats: {
        diggCount: item.stats?.diggCount || 0,
        shareCount: item.stats?.shareCount || 0,
        commentCount: item.stats?.commentCount || 0,
        playCount: item.stats?.playCount || 0
      },
      music: item.music ? {
        id: item.music.id,
        title: item.music.title,
        playUrl: item.music.playUrl || null,
        cover: item.music.coverThumb || null,
        authorName: item.music.authorName || null
      } : null
    };
  } catch (error) {
    console.error("Error formateando video:", error.message);
    return {
      id: item.id,
      desc: item.desc || '',
      video: {},
      author: {},
      stats: {}
    };
  }
}

/**
 * Extrae videos de forma recursiva de cualquier estructura de datos
 */
function extractVideosRecursive(data, videos, limit) {
  if (!data || typeof data !== 'object' || videos.length >= limit) return;

  // Si es un objeto que parece video
  if (data.id && (data.video || data.desc || data.author)) {
    videos.push(formatVideoData(data));
    return;
  }

  // Si es un array de items
  if (Array.isArray(data)) {
    for (const item of data) {
      if (videos.length >= limit) break;
      extractVideosRecursive(item, videos, limit);
    }
    return;
  }

  // Buscar en propiedades conocidas
  const knownKeys = ['items', 'videos', 'ItemList', 'ItemModule', 'data', 'result', 'search'];

  for (const key of knownKeys) {
    if (data[key] && videos.length < limit) {
      extractVideosRecursive(data[key], videos, limit);
    }
  }

  // Buscar en todas las propiedades
  for (const key in data) {
    if (videos.length >= limit) break;

    // Evitar recursión infinita
    if (key === 'parent' || key === '__proto__') continue;

    const value = data[key];
    if (value && typeof value === 'object') {
      extractVideosRecursive(value, videos, limit);
    }
  }
}

/**
 * Obtiene información de un video específico
 */
async function getVideoInfo(videoUrl) {
  try {
    const response = await http.get(videoUrl);

    if (!response.data) {
      throw new Error("No se recibieron datos");
    }

    const $ = cheerio.load(response.data);

    // Buscar en SIGI_STATE
    const sigiState = $('#SIGI_STATE').html();

    if (sigiState) {
      const data = JSON.parse(sigiState);

      // Buscar el video en ItemModule
      if (data.ItemModule) {
        const videoId = Object.keys(data.ItemModule)[0];
        const videoData = data.ItemModule[videoId];

        if (videoData) {
          return formatVideoData(videoData);
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error obteniendo video:", error.message);
    return null;
  }
}

/**
 * Extrae el ID de un video de una URL
 */
function extractVideoId(url) {
  const patterns = [
    /\/video\/(\d+)/,
    /\/v\/(\d+)/,
    /tiktok\.com\/(\w+)\/video\/(\d+)/,
    /vm\.tiktok\.com\/(\w+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1] || match[2] || match[0];
    }
  }

  return null;
}

module.exports = {
  searchTikTok,
  getVideoInfo,
  extractVideoId
};
