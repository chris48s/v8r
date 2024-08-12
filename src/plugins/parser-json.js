import { BasePlugin } from "../plugins.js";

class JsonParser extends BasePlugin {
  static name = "v8r-plugin-json-parser";

  registerDocumentParsers() {
    return ["json"];
  }

  parseDocument(contents, filename, parser) {
    if (parser === "json") {
      return JSON.parse(contents);
    } else if (parser == null) {
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
