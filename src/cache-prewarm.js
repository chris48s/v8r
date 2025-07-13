import isUrl from "is-url";
import pLimit from "p-limit";
import { getCatalogs, getMatchForFilename } from "./catalogs.js";
import { getFromUrlOrFile } from "./io.js";

const limit = pLimit(10);

function getFromUrlOrFileWithLimit(url, cache) {
  return limit(() => getFromUrlOrFile(url, cache));
}

function resolveUrl(base, ref) {
  try {
    const url = new URL(ref, base);
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function getRemoteRefs(node, baseUrl) {
  let refs = [];
  if (Array.isArray(node)) {
    for (const v of node) {
      if (typeof v === "object" && v !== null) {
        refs = refs.concat(getRemoteRefs(v, baseUrl));
      }
    }
  } else if (typeof node === "object" && node !== null) {
    for (const [k, v] of Object.entries(node)) {
      if (k === "$ref" && typeof v === "string") {
        if (!v.startsWith("#") && !v.startsWith("/")) {
          const resolved = resolveUrl(baseUrl, v);
          if (resolved && isUrl(resolved)) {
            refs.push(resolved);
          }
        }
      }
      if (typeof v === "object" && v !== null) {
        refs = refs.concat(getRemoteRefs(v, baseUrl));
      }
    }
  }
  return Array.from(new Set(refs));
}

async function fetchAndRecurse(url, cache) {
  const schema = await getFromUrlOrFileWithLimit(url, cache);
  const baseUrl = url;
  const refs = getRemoteRefs(schema, baseUrl);
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
  }

  await Promise.all(
    Array.from(schemaLocations)
      .filter((schemaLocation) => isUrl(schemaLocation))
      .map((url) => fetchAndRecurse(url, cache)),
  );
}

export { getRemoteRefs, prewarmSchemaCache, resolveUrl };
