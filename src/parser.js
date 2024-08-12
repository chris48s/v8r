import path from "path";
import yaml from "js-yaml";

function parseDocument(plugins, contents, filename, parser) {
  for (const plugin of plugins) {
    const result = plugin.parseDocument(contents, filename, parser);
    if (result != null) {
      return result;
    }
  }

  const errorMessage = parser
    ? `Unsupported format ${parser}`
    : `Unsupported format ${path.extname(filename).slice(1)}`;
  throw new Error(errorMessage);
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
