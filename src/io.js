import fs from "fs";
import path from "path";
import isUrl from "is-url";

async function getFromUrlOrFile(location, cache, base = null) {
  if (isUrl(location)) {
    return await cache.fetch(location);
  } else {
    if (base != null) {
      return JSON.parse(
        await fs.promises.readFile(path.join(base, location), "utf8"),
      );
    }
  }
  return JSON.parse(await fs.promises.readFile(location, "utf8"));
}

export { getFromUrlOrFile };
