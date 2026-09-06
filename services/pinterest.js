const axios = require("axios");

const BASE_URL = "https://id.pinterest.com/resource/BaseSearchResource/get/";

const HEADERS = {
  authority: "id.pinterest.com",
  accept: "application/json, text/javascript, */*, q=0.01",
  "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "content-type": "application/x-www-form-urlencoded",
  cookie: process.env.PINTEREST_COOKIE ||
    "csrftoken=c6c1ae81f3fa623853339b4174673ad8; _pinterest_sess=TWc9PSYvZ2RGcU1Ra2FweVMxb3p5MUI0L2lQcXhsbGNUS2xib21KalZWOG0wazFBQmdmRW9aOGk5MGtYMzRmWlRSUCtkcjFjMlIxRXVNRGxNZDQ4Q0JvVFJiUVNZK2JmeEZsczJ2UklWdC9kKzFuYz0mWVFpMVVDQ0hSYUExQTBveTZ5ZG1FVTdwN1FjPQ==; _auth=0; _routing_id=\"abd2e5b5-17e4-4fd3-aa85-67640f0c6ff3\"; sessionFunnelEventLogged=1",
  origin: "https://id.pinterest.com",
  referer: "https://id.pinterest.com/",
  "sec-ch-ua": '"Not A(Brand";v="8", "Chromium";v="132"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Linux"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
  "x-app-version": "f1222d7",
  "x-csrftoken": "c6c1ae81f3fa623853339b4174673ad8",
  "x-pinterest-appstate": "background",
  "x-pinterest-pws-handler": "www/search/[scope].js",
  "x-requested-with": "XMLHttpRequest"
};

async function makeRequest(params, isPost = true) {
  const sourceUrl = `/search/pins/?q=${encodeURIComponent(params.query)}&rs=typed`;
  try {
    const response = isPost
      ? await axios.post(BASE_URL, new URLSearchParams(params).toString(), {
          headers: { ...HEADERS, "x-pinterest-source-url": sourceUrl },
          responseType: "json"
        })
      : await axios.get(`${BASE_URL}?${new URLSearchParams(params)}`, {
          headers: { ...HEADERS, "x-pinterest-source-url": sourceUrl, "x-pinterest-appstate": "active" },
          responseType: "json"
        });
    return response.data;
  } catch (error) {
    return null;
  }
}

function formatResults(results) {
  return results.map((item) => {
    let videoUrl = null;
    if (item.videos?.video_list) {
      const firstVideoKey = Object.keys(item.videos.video_list)[0];
      videoUrl = item.videos.video_list[firstVideoKey]?.url;
      if (videoUrl && firstVideoKey.includes("HLS") && videoUrl.includes("m3u8")) {
        videoUrl = videoUrl.replace("hls", "720p").replace("m3u8", "mp4");
      }
    }
    return {
      pin_url: `https://www.pinterest.com/pin/${item.id ?? ""}`,
      link: item.link ?? null,
      id: item.id ?? "",
      title: item.grid_title || "Sin título",
      description: item.description ?? "",
      image: item.images?.orig?.url ?? null,
      video: videoUrl,
      gif: item.embed?.src && item.embed?.type === "gif" ? item.embed.src : null,
      type: item.videos ? "video" : item.embed?.type === "gif" ? "gif" : "image",
      created_at: item.created_at || null,
      pinner: {
        username: item.pinner?.username ?? "",
        full_name: item.pinner?.full_name ?? "",
        follower_count: item.pinner?.follower_count ?? 0
      }
    };
  });
}

async function pinterestSearch(query, typeFilter = null) {
  const initialParams = {
    source_url: `/search/pins/?q=${encodeURIComponent(query)}&rs=typed`,
    data: JSON.stringify({
      options: {
        query,
        rs: "typed",
        scope: "pins",
        redux_normalize_feed: true,
        source_url: `/search/pins/?q=${encodeURIComponent(query)}&rs=typed`
      },
      context: {}
    }),
    query,
    _: Date.now()
  };

  const firstResponse = await makeRequest(initialParams, false);
  if (!firstResponse) throw new Error("No se pudo contactar a Pinterest (revisa la cookie de sesión)");

  const firstResults = firstResponse.resource_response?.data?.results ?? [];
  let allResults = formatResults(firstResults);

  const bookmark = firstResponse.resource_response?.bookmark;
  if (bookmark) {
    const nextParams = {
      ...initialParams,
      data: JSON.stringify({
        options: { ...JSON.parse(initialParams.data).options, bookmarks: [bookmark] },
        context: {}
      })
    };
    const secondResponse = await makeRequest(nextParams);
    if (secondResponse?.resource_response?.data?.results) {
      allResults = allResults.concat(formatResults(secondResponse.resource_response.data.results));
    }
  }

  if (typeFilter) allResults = allResults.filter((r) => r.type === typeFilter);
  return allResults;
}

module.exports = { pinterestSearch };
