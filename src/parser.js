import path from "node:path";
import yaml from "js-yaml";
import { Document } from "./plugins.js";

function parseFile(plugins, contents, filename, parser) {
  for (const plugin of plugins) {
    const parsedFile = plugin.parseInputFile(contents, filename, parser);

    if (parsedFile != null) {
      const maybeDocuments = Array.isArray(parsedFile)
        ? parsedFile
        : [parsedFile];
      if (maybeDocuments.length === 0) {
        throw new Error(`No documents to validate found in ${filename}`);
      }
      for (const doc of maybeDocuments) {
        if (!(doc instanceof Document)) {
          throw new Error(
            `Plugin ${plugin.constructor.name} returned an unexpected type from parseInputFile hook. Expected Document, got ${typeof doc}`,
          );
        }
      }
      return maybeDocuments.map((md) => md.document);
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

export { parseFile, parseSchema };
