const axios = require("axios");
const client = require("../db/client");

// AnimeChan (https://animechan.io) — API pública gratuita de frases de anime.
// Límite: 5 solicitudes/hora en la capa anónima gratuita.
const BASE_URL = "https://api.animechan.io/v1/quotes/random";

async function ensureCacheTable() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS orbit_anime_quotes_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      anime TEXT,
      character TEXT,
      created_at TEXT NOT NULL
    )
  `);
}

async function fetchLiveQuote({ anime, character } = {}) {
  const params = {};
  if (anime) params.anime = String(anime).trim();
  if (character) params.character = String(character).trim();

  const response = await axios.get(BASE_URL, {
    params,
    timeout: 10000,
    headers: {
      "User-Agent": "OrbitAPI/1.0 (https://orbit-api.onrender.com)",
      "Accept": "application/json"
    }
  });

  const quote = response.data && response.data.data;
  if (!quote || !quote.content) {
    throw new Error("Respuesta sin campo 'content'");
  }

  return {
    quote: quote.content,
    anime: quote.anime ? quote.anime.name : null,
    character: quote.character ? quote.character.name : null
  };
}

async function saveToCache(result) {
  try {
    await ensureCacheTable();
    await client.execute({
      sql: "INSERT INTO orbit_anime_quotes_cache (content, anime, character, created_at) VALUES (?, ?, ?, ?)",
      args: [result.quote, result.anime, result.character, new Date().toISOString()]
    });
  } catch (error) {
    console.error("[animeQuotes.js] No se pudo guardar en cache:", error.message);
  }
}

async function getFromCache({ anime, character } = {}) {
  await ensureCacheTable();

  let sql = "SELECT content, anime, character FROM orbit_anime_quotes_cache";
  const conditions = [];
  const args = [];

  if (anime) {
    conditions.push("LOWER(anime) LIKE ?");
    args.push(`%${String(anime).toLowerCase()}%`);
  }
  if (character) {
    conditions.push("LOWER(character) LIKE ?");
    args.push(`%${String(character).toLowerCase()}%`);
  }
  if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
  sql += " ORDER BY RANDOM() LIMIT 1";

  const result = await client.execute({ sql, args });
  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return { quote: row.content, anime: row.anime, character: row.character };
}

/**
 * Obtiene una frase random de anime.
 *
 * Intenta primero la API en vivo de AnimeChan (limite: 5 solicitudes/hora
 * en su capa gratuita). Cada frase obtenida en vivo se guarda en un cache
 * local (tabla orbit_anime_quotes_cache). Cuando el limite de AnimeChan se
 * agota (HTTP 429) o falla la conexion, responde desde ese cache local en
 * vez de cortar el servicio a los usuarios de Orbit. El cache se va
 * llenando solo con el uso normal del endpoint.
 */
async function getRandomQuote({ anime, character } = {}) {
  try {
    const live = await fetchLiveQuote({ anime, character });
    saveToCache(live).catch(() => {});
    return live;
  } catch (error) {
    const isRateLimited = Boolean(error.response && error.response.status === 429);
    const detail = error.response
      ? `HTTP ${error.response.status}`
      : error.message;
    console.error(`[animeQuotes.js] Fallo en vivo (${detail}), probando cache local`);

    const cached = await getFromCache({ anime, character });
    if (cached) return cached;

    throw new Error(
      isRateLimited
        ? "Límite de la API de frases alcanzado y el cache local todavía está vacío, intenta de nuevo en un momento"
        : "No se encontró ninguna frase con esos filtros"
    );
  }
}

module.exports = { getRandomQuote };