const axios = require("axios");

const INITIAL_URL = "https://gemini.google.com";
const STREAM_URL = "https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate";

function buildHeaders(cookie) {
  return {
    accept: "*/*",
    "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    "x-same-domain": "1",
    cookie: `__Secure-1PSID=${cookie}`,
    Referer: "https://gemini.google.com/",
    "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36"
  };
}

async function fetchWizData(headers) {
  try {
    const response = await axios.get(INITIAL_URL, { headers });
    const match = response.data.match(/window\.WIZ_global_data\s*=\s*({[\s\S]*?});/);
    return match ? JSON.parse(match[1]) : null;
  } catch (error) {
    return null;
  }
}

async function geminiQuery(text, options = {}) {
  const cookie = options.cookie || process.env.GEMINI_COOKIE;
  if (!cookie) throw new Error("No hay cookie de Gemini configurada (GEMINI_COOKIE)");

  const headers = buildHeaders(cookie);
  const wizData = await fetchWizData(headers);
  if (!wizData) throw new Error("No se pudo iniciar sesion con Gemini (cookie invalida o vencida)");

  const { conversationID, responseID, choiceID, systemPrompt } = options;

  const params = {
    bl: wizData.cfb2h,
    "f.sid": wizData.FdrFJe,
    hl: "es",
    _reqid: Math.floor(Math.random() * 9000000 + 1000000).toString(),
    rt: "c"
  };

  const messageStruct = [
    [text, 0, null, null, null, null, 0],
    ["es"],
    [conversationID || "", responseID || "", choiceID || "", null, null, null, null, null, null, ""],
    null, null, null, [1], 1, null, null, 1, 0, null, null, null, null, null, [[0]], 1, null, null, null, null, null,
    ["", "", systemPrompt || "", null, null, null, null, null, 0, null, 1, null, null, null, []],
    null, null, 1, null, null, null, null, null, null, null,
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], 1, null, null, null, null, [1]
  ];

  const data = {
    "f.req": JSON.stringify([null, JSON.stringify(messageStruct)]),
    at: wizData.SNlM0e
  };

  const response = await axios.post(STREAM_URL, new URLSearchParams(data).toString(), { headers, params });
  const lines = String(response.data).split("\n");

  let messageText = "";
  let cID = null;
  let rID = null;
  let chID = null;

  for (const line of lines) {
    if (!line.startsWith('[["wrb.fr"')) continue;
    try {
      const parsedLine = JSON.parse(line.match(/\[\["wrb\.fr".*\]\]/)[0]);
      const parsedChat = JSON.parse(parsedLine[0][2]);
      if (parsedChat[4]?.[0]?.[1]?.[0]) messageText = parsedChat[4][0][1][0];
      if (parsedChat[1]?.length >= 2) {
        cID = parsedChat[1][0];
        rID = parsedChat[1][1];
      }
      if (parsedChat[4]?.[0]?.[0]) chID = parsedChat[4][0][0];
    } catch (error) {
      // línea no relevante, se ignora
    }
  }

  if (!messageText) throw new Error("Gemini no devolvio una respuesta (cookie posiblemente vencida)");

  return {
    response: messageText.replace(/http:\/\/googleusercontent\.com\/[^ ]+/g, "").trim(),
    conversationID: cID,
    responseID: rID,
    choiceID: chID
  };
}

module.exports = { geminiQuery };
