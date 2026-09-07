const Tiktok = require("@tobyg74/tiktok-api-dl");

async function downloadTiktok(url) {
  const versions = ["v1", "v3", "v2"];
  let lastError = "No se pudo descargar el video";

  for (const version of versions) {
    try {
      const result = await Tiktok.Downloader(url.trim(), { version });
      if (result.status === "success" && result.result) {
        return { status: true, version, data: result.result };
      }
      lastError = result.message || lastError;
    } catch (error) {
      lastError = error.message || lastError;
    }
  }

  return { status: false, error: lastError };
}

module.exports = { downloadTiktok };
