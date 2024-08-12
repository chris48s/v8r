import { BasePlugin } from "../plugins.js";

class JsonParser extends BasePlugin {
  static name = "v8r-plugin-json-parser";

  registerFileParsers() {
    return ["json"];
  }

  parseFile(contents, fileLocation, parser) {
    if (parser === "json") {
      return JSON.parse(contents);
    } else if (parser == null) {
      if (
        fileLocation.endsWith(".json") ||
        fileLocation.endsWith(".geojson") ||
        fileLocation.endsWith(".jsonld")
      ) {
        return JSON.parse(contents);
      }
    }
  }
}

export default JsonParser;
