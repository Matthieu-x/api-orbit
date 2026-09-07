const axios = require("axios");

const SEARCH_URL =
  "https://search.f-droid.org/api/search_apps";

const PACKAGE_URL =
  "https://f-droid.org/api/v1/packages";

const REPO_URL =
  "https://f-droid.org/repo";

const HEADERS = {
  "User-Agent": "Orbit-API/1.0"
};

async function searchFdroid(query) {
  if (!query) {
    throw new Error("El parámetro query es requerido");
  }

  const { data } = await axios.get(SEARCH_URL, {
    params: {
      q: String(query)
    },
    headers: HEADERS,
    timeout: 15000
  });

  const list = Array.isArray(data)
    ? data
    : data.results ||
      data.apps ||
      data.items ||
      [];

  return list
    .map(normalizeSearchResult)
    .filter(Boolean);
}

function normalizeSearchResult(app) {
  if (!app || typeof app !== "object") {
    return null;
  }

  const packageName =
    app.packageName ||
    app.package ||
    app.id ||
    app.appId;

  if (!packageName) {
    return null;
  }

  return {
    name:
      app.name ||
      app.title ||
      packageName,

    package: packageName,

    summary:
      app.summary ||
      app.description ||
      null,

    icon:
      app.icon ||
      app.iconUrl ||
      null,

    url:
      app.url ||
      `https://f-droid.org/packages/${packageName}/`
  };
}

async function getFdroidPackage(packageName) {
  if (!packageName) {
    throw new Error("El package es requerido");
  }

  const { data } = await axios.get(
    `${PACKAGE_URL}/${encodeURIComponent(packageName)}`,
    {
      headers: HEADERS,
      timeout: 15000
    }
  );

  const packages = Array.isArray(data.packages)
    ? data.packages
    : [];

  const suggested =
    Number(data.suggestedVersionCode || 0);

  const selected =
    packages.find(
      p => Number(p.versionCode) === suggested
    ) ||
    packages[packages.length - 1];

  if (!selected) {
    throw new Error(
      "No hay una versión publicada disponible"
    );
  }

  const versionCode =
    selected.versionCode;

  return {
    package:
      data.packageName ||
      packageName,

    version:
      selected.versionName ||
      null,

    versionCode,

    downloadUrl:
      `${REPO_URL}/${encodeURIComponent(
        packageName
      )}_${encodeURIComponent(
        versionCode
      )}.apk`
  };
}

module.exports = {
  searchFdroid,
  getFdroidPackage
};