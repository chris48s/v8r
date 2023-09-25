import fs from "fs";
import path from "path";
import isUrl from "is-url";
import { parseFile } from "./parser.js";

async function getFromUrlOrFile(location, cache, base = null) {
  if (isUrl(location)) {
    return await cache.fetch(location);
  } else {
    if (base != null) {
      if (location.endsWith(".yml") || location.endsWith(".yaml"))
        return parseFile(
          await fs.promises.readFile(path.join(base, location), "utf8"),
          ".yaml",
        );
      else
        return JSON.parse(
          await fs.promises.readFile(path.join(base, location), "utf8"),
        );
    }
  }
  if (location.endsWith(".yml") || location.endsWith(".yaml"))
    return parseFile(await fs.promises.readFile(location, "utf8"), ".yaml");
  else return JSON.parse(await fs.promises.readFile(location, "utf8"));
}

export { getFromUrlOrFile };
