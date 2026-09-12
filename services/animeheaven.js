// services/animeheaven.js
// Wrapper de la librería liyanaarachchi-animeheavenme.
// Exporta 3 funciones async confirmadas: searchAnime, getEpisodes, getVideoLink.
// Flujo real: buscar anime -> elegir uno -> ver sus episodios -> sacar el
// link del video de un episodio. No es un solo paso.

const { searchAnime, getEpisodes, getVideoLink } = require("liyanaarachchi-animeheavenme");

async function search(query) {
  return searchAnime(query);
}

async function episodes(animeIdOrUrl) {
  return getEpisodes(animeIdOrUrl);
}

async function videoLink(episodeIdOrUrl) {
  return getVideoLink(episodeIdOrUrl);
}

module.exports = { search, episodes, videoLink };
