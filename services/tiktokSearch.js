// services/tiktokSearch.js
const Tiktok = require("@tobyg74/tiktok-api-dl");

const TIKTOK_COOKIE = "ak_bmsc=E7D98FCB3D85D85F7EF79D769BC15BD4~000000000000000000000000000000~YAAQFYYCuo4umHGgAQAA6JnjhwEfup5wJPTAUImxhsFTXuLKZN+iAzXTG5MQwJHSuwhnYUR17nIFE2/R4FBIA6hJymqnrTGMQ6f/zAhlCkOonq0VEKXkYXYlAeJhJiH4pQg+3/d2al9Cf6zVPvAa6hVtjPwwb9AYnBx0jdth9wIf6XHwJJjOE/Wb5gKDhVb807STLlV3/E3LcT9Qa6FyPxGQ+neoxJb9kcGa9p1pysnkGJ7j5U+GZgfGea+DkuL0buWrVzcuzGPcnLHlm+BPO9zihqqTcVJJMTPr5H1ey2YMHUi9oEq/t86rkjIfssZitJhmDq9WKLcp1dtc9wzYJ4GO/LNH94LbStVx5rUNhg57IB07uJPeSt3inXFcoEiKWggvzwLKrE98cnc=; tt-target-idc-sign=rcqjwmZgRkMV0KSCjdNF9D4TMgPBKk9OA6od7wsu83kQFLITrdUfosUDQRe8NAxhxEQnC4OjqY2g-Yliei8hOfCjV9kKZezXLahYd2RezxEQBWj1_Sl1-hlrXfL3WIELWC6LTc8xzJkuC6MUEUmIybd-zB-sHwk5SHCx3pTy8wSmi6vROzbozJnWD8ki1LVHz_jRdTM0c0QT5kehVwKe6IL4QhiOdE5jo6z7wpMGo3ktKWj7x05OfW1qICh7WVQh4cn93WUuYLcFLEzox10E0uT3pp5bFgD2--FX-lq9xycBCMiEWLlLvg-oXOa2bwwZs2UWywVLWOVP4aWKoEi6LLH2LZ9ScJm-c9Gq45EKQwFdwrFedySBSuTH0BN6SuAO0FYIgHt0yo-kDO84w4uWZD5WQJ6E5af_x3GMXXkNqIDvNbXnYwMqMFuJakDPlclpFaL31lOJc92dGjAk42ghiw5iWAJ3A-B81KtmICqAHvKQLwVCJScO0FxtTirktVnV; msToken=sWQEVKIvEzI_Cxr0NKY1_Zc-YvUMPj9kdowT568jN9JRSLUQuGpTJCDqtYDkwIV6aggA38tcHPbjor8HRegsRQhP-dKnxVsADTOiGCZTS7usMoDLnpZdKWS-PR8U29KHRCznwPMGYW8=; tt_session_tlb_tag=sttt%7C4%7CIIBmXJxkjwtgNFctUTfGH__________j5cue-yL1dmGi6EQUhBH4AN_gPvfzJMZtbQxo_srdJdY%3D; sid_guard=2080665c9c648f0b6034572d5137c61f%7C1788986409%7C15551999%7CMon%2C+08-Mar-2027+20%3A40%3A08+GMT; ttwid=1%7CGa64wDSQNdj-IO6mOCb4iOo20E1iYeWM9FdyI_Dqp7E%7C1788986306%7Ca50688591110ae4146bf657e8f176bbce37d3a9d4247e0a3ebde8a70fb917a0b; store-country-code-src=uid; s_v_web_id=verify_mtukb14l_nDvKeCa8_dtq4_4XqN_82yS_6z6SWX3KesKM; store-idc=alisg; ssid_ucp_v1=1.0.1-KDZhMDJmYjFjZmUyMTNjNzhmMzE0OWMwYWMwYzVhOTc1MzJiNWU4N2QKIQiHiNrmrIecn2oQqYiH1QYYswsgDDDU4PnRBjgIQBJIBBADGgNzZzEiIDIwODA2NjVjOWM2NDhmMGI2MDM0NTcyZDUxMzdjNjFmMk4KIOzU0g4XQ8ei1p5uszSPD57LkI1y2ZreaLNi0eCHHT_vEiDh4a7I9hwrT9-BsAXpT_03Ix9XE6LsUPTrZCgOcZc17hgFIgZ0aWt0b2s; tiktok_webapp_theme=light; tt_csrf_token=QbDMrAk8-nyp3uJDhHq1gpaXjs-mx1Kl3ki8; tt_chain_token=vT2J9niit4FZwt+Z5C3jvw==; bm_sv=D47558C0F3634C942B76791CADE2ADD4~YAAQD4YCut+j/36gAQAANWLnhwHCfo+Q3bJsJEWPkEsEB09f/D+nWldtH5x+8JbETsPAfkiH+2BQlfbjMc2zDPhZxqdVvRVMqn4y8u3gKJ210nXUj69IihOYRBDh78ZV0ok1v+13dzHWZMjkhqAJnqJ0xzjVA/YQNQOtRktjfRKBzBloUhg9TKDjUKM4sujqC/5reuYepDrC4VjnsSNEbpNPVtLo2sPEi44DU1hsNmk8oTPLLF9tcnv/RdiFrXT2Xw==~1; tiktok_webapp_theme_source=light; passport-sotl-auth-token-nonce_e6nc89ksdbnGdm9CY8JM-R6eUnknBEul0qED_COZ94I=e6nc89ksdbnGdm9CY8JM-R6eUnknBEul0qED_COZ94I; multi_sids=7655679814423446535%3A2080665c9c648f0b6034572d5137c61f; odin_tt=e971525c096343a819f902d066cca243eada897105bac68638292648b18b277b1575cdc7af30c5b8c0dba0d4875af15c21ec6d72b91e0dfa0e7a23f0c08326c2d35c294a18d16909f2bd44fe73ee017b; cmpl_token=AgQYAPN5_hfkTtK6AJ6dRORdPvDAWkZHR3-K8mClbow; passport_auth_status=67b466ef895c58b5c8615f35782632ae%2C; passport_auth_status_ss=67b466ef895c58b5c8615f35782632ae%2C; uid_tt_ss=a5acefb0d97391263b14d8ae052c72b327bf7808bbf89d966b3c1c12b6aef585; uid_tt=a5acefb0d97391263b14d8ae052c72b327bf7808bbf89d966b3c1c12b6aef585; sid_tt=2080665c9c648f0b6034572d5137c61f; sessionid=2080665c9c648f0b6034572d5137c61f; sessionid_ss=2080665c9c648f0b6034572d5137c61f; sid_ucp_v1=1.0.1-KDZhMDJmYjFjZmUyMTNjNzhmMzE0OWMwYWMwYzVhOTc1MzJiNWU4N2QKIQiHiNrmrIecn2oQqYiH1QYYswsgDDDU4PnRBjgIQBJIBBADGgNzZzEiIDIwODA2NjVjOWM2NDhmMGI2MDM0NTcyZDUxMzdjNjFmMk4KIOzU0g4XQ8ei1p5uszSPD57LkI1y2ZreaLNi0eCHHT_vEiDh4a7I9hwrT9-BsAXpT_03Ix9XE6LsUPTrZCgOcZc17hgFIgZ0aWt0b2s; store-country-code=hn; tt-target-idc=alisg; store-country-sign=MEIEDHlCi_5X0WxbcWf6iwQgOHSdn9hJBVvKpPYTG2rUOjwORrHVWfr-wvOpZVIMbjAEEPDIWPsp7jIsEnLnRcYR7so; last_login_method=google";

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

async function searchTikTok(query, limit = 10) {
  const videos = [];

  try {
    const result = await Promise.race([
      Tiktok.Search(query, {
        type: "video",
        page: 1,
        cookie: TIKTOK_COOKIE
      }),

      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Timeout buscando en TikTok")),
          30000
        )
      )
    ]);

    console.log(
      `[tiktokSearch] status=${result?.status} items=${
        Array.isArray(result?.result)
          ? result.result.length
          : "n/a"
      } message=${result?.message || "-"}`
    );

    if (result?.status !== "success") {
      return {
        videos: [],
        debug: `TikTok respondió status="${result?.status}"${
          result?.message
            ? `: ${result.message}`
            : ""
        }`
      };
    }

    if (!Array.isArray(result.result) || result.result.length === 0) {
      return {
        videos: [],
        debug: "No se encontraron resultados."
      };
    }

    for (const item of result.result) {
      if (item?.id) {
        videos.push(mapVideo(item));
      }

      if (videos.length >= limit) break;
    }

    return {
      videos: videos.slice(0, limit),
      debug: videos.length ? null : "No se encontraron resultados."
    };

  } catch (error) {
    console.error(`[tiktokSearch] ${error.message}`);

    return {
      videos: [],
      debug: error.message
    };
  }
}

module.exports = {
  searchTikTok
};