import JSON5 from "json5";
import yaml from "js-yaml";

function parseFile(contents, format) {
  switch (format) {
    case ".json":
    case ".geojson":
    case ".jsonld":
      return JSON.parse(contents);
    case ".jsonc":
    case ".json5":
      return JSON5.parse(contents);
    case ".yml":
    case ".yaml":
      return yaml.load(contents);
    default:
      throw new Error(`Unsupported format ${format}`);
  }
}

export { parseFile };
