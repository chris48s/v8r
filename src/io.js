import fs from "fs";
import path from "path";
import isUrl from "is-url";
import yaml from "js-yaml";

async function getFromUrlOrFile(location, cache, base = null) {
  if (isUrl(location)) {
    return await cache.fetch(location);
  } else {
    if (base != null) {
      return readSchemaFromFileContents(
        path.join(base, location),
        await fs.promises.readFile(path.join(base, location), "utf8"),
      );
    }
  }
  return readSchemaFromFileContents(
    location,
    await fs.promises.readFile(location, "utf8"),
  );
}

function readSchemaFromFileContents(location, fileContents) {
  if (location.endsWith(".yml") || location.endsWith(".yaml"))
    return yaml.load(fileContents);
  else return JSON.parse(fileContents);
}
export { getFromUrlOrFile, readSchemaFromFileContents };
