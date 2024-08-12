import JSON5 from "json5";
import { BasePlugin } from "../plugins.js";

class Json5Parser extends BasePlugin {
  static name = "v8r-plugin-json5-parser";

  registerDocumentParsers() {
    return ["json5"];
  }

  parseDocument(contents, filename, parser) {
    if (parser === "json5") {
      return JSON5.parse(contents);
    } else if (parser == null) {
      if (filename.endsWith(".json5") || filename.endsWith(".jsonc")) {
        return JSON5.parse(contents);
      }
    }
  }
}

export default Json5Parser;
