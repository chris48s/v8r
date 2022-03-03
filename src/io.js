import fs from "fs";
import isUrl from "is-url";

async function getFromUrlOrFile(location, cache) {
  return isUrl(location)
    ? await cache.fetch(location)
    : JSON.parse(await fs.promises.readFile(location, "utf8"));
}

export { getFromUrlOrFile };
