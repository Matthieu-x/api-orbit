const axios = require("axios");

const http = axios.create({
  baseURL: "https://www.pinterest.com",
  headers: {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    accept: "application/json, text/javascript, */*, q=0.01",
    "x-requested-with": "XMLHttpRequest",
    "accept-language": "en-US,en;q=0.9"
  },
  timeout: 15000
});

function pickImage(pin) {
  const images = pin?.images || {};
  return images.orig?.url || images["736x"]?.url || images["474x"]?.url || images["236x"]?.url || null;
}

function pickVideo(pin) {
  const list = pin?.videos?.video_list || {};
  const preferred = list.V_HLSV4 || list.V_720P || list.V_EXP7 || Object.values(list)[0];
  return preferred?.url || null;
}

async function pinterestSearch(query, limit = 25) {
  const pageSize = Math.min(Math.max(Number(limit) || 25, 1), 50);

  const params = {
    source_url: `/search/pins/?q=${encodeURIComponent(query)}`,
    data: JSON.stringify({
      options: { query, scope: "pins", page_size: pageSize },
      context: {}
    })
  };

  const response = await http.get("/resource/BaseSearchResource/get/", { params });
  const results = response?.data?.resource_response?.data?.results || [];

  return results
    .filter((pin) => pin && pin.id)
    .map((pin) => ({
      id: pin.id,
      title: pin.title || pin.grid_title || "Sin título",
      description: pin.description || "",
      pin_url: `https://www.pinterest.com/pin/${pin.id}/`,
      image: pickImage(pin),
      video: pickVideo(pin),
      is_video: Boolean(pin.videos),
      dominant_color: pin.dominant_color || null
    }))
    .filter((pin) => pin.image || pin.video)
    .slice(0, pageSize);
}

module.exports = { pinterestSearch };
