import { BasePlugin } from "../plugins.js";

class JsonParser extends BasePlugin {
  static name = "v8r-plugin-json-parser";

  registerDocumentFormats() {
    return ["json"];
  }

  parseDocument(contents, filename, format) {
    if (format === "json") {
      return JSON.parse(contents);
    } else if (format == null) {
      if (
        filename.endsWith(".json") ||
        filename.endsWith(".geojson") ||
        filename.endsWith(".jsonld")
      ) {
        return JSON.parse(contents);
      }
    }
  }
}

export default JsonParser;
