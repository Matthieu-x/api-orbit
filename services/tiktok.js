const axios = require("axios");

async function downloadTiktok(url) {
  const { data } = await axios.get("https://www.tikwm.com/api/", {
    params: { url, hd: 1 }
  });

  if (!data || data.code !== 0 || !data.data) {
    return { status: false, error: "No se pudo procesar ese link" };
  }

  const v = data.data;

  return {
    status: true,
    title: v.title,
    author: v.author?.nickname,
    duration: v.duration,
    plays: v.play_count,
    likes: v.digg_count,
    comments: v.comment_count,
    cover: v.cover,
    no_watermark: v.play,
    no_watermark_hd: v.hdplay,
    music: v.music
  };
}

module.exports = { downloadTiktok };
