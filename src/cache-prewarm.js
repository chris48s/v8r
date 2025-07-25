import isUrl from "is-url";
import pLimit from "p-limit";
import { getCatalogs, getMatchForFilename } from "./catalogs.js";

const limit = pLimit(10);

async function fetch(location, cache) {
  return await cache.fetch(location, false);
}

function fetchWithLimit(url, cache) {
  return limit(() => fetch(url, cache));
}

function normalizeUrl(ref) {
  try {
    const url = new URL(ref);
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function getRemoteRefs(node) {
  let refs = [];
  if (Array.isArray(node)) {
    for (const v of node) {
      if (typeof v === "object" && v !== null) {
        refs = refs.concat(getRemoteRefs(v));
      }
    }
  } else if (typeof node === "object" && node !== null) {
    for (const [k, v] of Object.entries(node)) {
      if (k === "$ref" && typeof v === "string") {
        const resolved = normalizeUrl(v);
        if (resolved && isUrl(resolved)) {
          refs.push(resolved);
        }
      }
      if (typeof v === "object" && v !== null) {
        refs = refs.concat(getRemoteRefs(v));
      }
    }
  }
  return Array.from(new Set(refs));
}

async function fetchAndRecurse(url, cache) {
  const schema = await fetchWithLimit(url, cache);
  const refs = getRemoteRefs(schema).filter(
    (ref) => cache.get(ref) === undefined,
  );
  await Promise.all(refs.map((ref) => fetchAndRecurse(ref, cache)));
}

async function prewarmSchemaCache(filenames, config, cache) {
  const catalogs = getCatalogs(config);
  const schemaLocations = new Set();

  for (const filename of filenames) {
    let catalogMatch;
    try {
      catalogMatch = config.schema
        ? {}
        : await getMatchForFilename(catalogs, filename, "debug", cache);
    } catch {
      catalogMatch = {};
    }
    const schemaLocation = config.schema || catalogMatch.location;

    if (schemaLocation) {
      schemaLocations.add(schemaLocation);
    }
    cache.resetCounters();
  }

  await Promise.all(
    Array.from(schemaLocations)
      .filter((schemaLocation) => isUrl(schemaLocation))
      .map((url) => fetchAndRecurse(url, cache)),
  );
  cache.persist();
  cache.resetCounters();
}

export { getRemoteRefs, prewarmSchemaCache, normalizeUrl };
