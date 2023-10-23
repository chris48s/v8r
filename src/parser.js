import JSON5 from "json5";
import yaml from "js-yaml";

function parseDocument(contents, format) {
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

function parseSchema(contents, location) {
  if (location.endsWith(".yml") || location.endsWith(".yaml")) {
    return yaml.load(contents);
  }
  /*
  Always fall back and assume json even if no .json extension
  Sometimes a JSON schema is served from a URL like
  https://json-stat.org/format/schema/2.0/
  */
  return JSON.parse(contents);
}

export { parseDocument, parseSchema };
