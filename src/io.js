import fs from "fs";
import path from "path";
import isUrl from "is-url";
import { parseSchema } from "./parser.js";

async function getFromUrlOrFile(location, cache, base = null) {
  if (isUrl(location)) {
    return await cache.fetch(location);
  } else {
    if (base != null) {
      return parseSchema(
        await fs.promises.readFile(path.join(base, location), "utf8"),
        path.join(base, location),
      );
    }
  }
  return parseSchema(await fs.promises.readFile(location, "utf8"), location);
}

export { getFromUrlOrFile };
