import fs from "fs";
import path from "path";
import isUrl from "is-url";
import yaml from "js-yaml";

async function getFromUrlOrFile(location, cache, base = null) {
  if (isUrl(location)) {
    return await cache.fetch(location);
  } else {
    if (base != null) {
      if (location.endsWith(".yml") || location.endsWith(".yaml"))
        return yaml.load(
          await fs.promises.readFile(path.join(base, location), "utf8"),
        );
      else
        return JSON.parse(
          await fs.promises.readFile(path.join(base, location), "utf8"),
        );
    }
  }
  if (location.endsWith(".yml") || location.endsWith(".yaml"))
    return yaml.load(await fs.promises.readFile(location, "utf8"));
  else return JSON.parse(await fs.promises.readFile(location, "utf8"));
}

export { getFromUrlOrFile };
