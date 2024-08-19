import { BasePlugin, Document } from "../plugins.js";

class JsonParser extends BasePlugin {
  static name = "v8r-plugin-json-parser";

  registerInputFileParsers() {
    return ["json"];
  }

  parseInputFile(contents, fileLocation, parser) {
    if (parser === "json") {
      return new Document(JSON.parse(contents));
    } else if (parser == null) {
      if (
        fileLocation.endsWith(".json") ||
        fileLocation.endsWith(".geojson") ||
        fileLocation.endsWith(".jsonld")
      ) {
        return new Document(JSON.parse(contents));
      }
    }
  }
}

export default JsonParser;
