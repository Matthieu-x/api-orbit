const express = require("express");
const axios = require("axios");

const router = express.Router();

async function ytsearch(query) {
  const response = await axios({
    method: "GET",
    url: "https://www.youtube.com/results",
    params: { search_query: query },
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9"
    },
    timeout: 10000
  });

  const match = response.data.match(/var ytInitialData = ({.+?});/);
  if (!match) throw new Error("No se pudieron extraer los videos.");

  const initialData = JSON.parse(match[1]);
  const contents = initialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
  const videos = [];

  outer: for (const section of contents) {
    for (const item of section?.itemSectionRenderer?.contents || []) {
      const video = item?.videoRenderer;
      if (!video?.videoId) continue;
      videos.push({
        title: video?.title?.runs?.[0]?.text || "Sin título",
        videoId: video.videoId,
        url: `https://www.youtube.com/watch?v=${video.videoId}`,
        duration: video?.lengthText?.simpleText || "0:00",
        views: video?.viewCountText?.simpleText || "0 vistas",
        thumbnail: video?.thumbnail?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
        author: video?.ownerText?.runs?.[0]?.text || "Desconocido",
        authorId: video?.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || "",
        publishedAt: video?.publishedTimeText?.simpleText || "",
        description: video?.descriptionSnippet?.runs?.map((r) => r.text).join("") || ""
      });
      if (videos.length >= 30) break outer;
    }
  }
  return videos;
}

router.get("/", async (req, res) => {
  const query = String(req.query.query || "").trim();
  if (!query) return res.status(400).json({ status: false, creator: "Orbit", error: "El parámetro query es requerido" });
  if (query.length > 100) return res.status(400).json({ status: false, creator: "Orbit", error: "El parámetro query es demasiado largo" });

  try {
    const results = await ytsearch(query);
    res.json({ status: true, creator: "Orbit", query, total: results.length, results, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: false, creator: "Orbit", error: error.message });
  }
});

module.exports = router;
