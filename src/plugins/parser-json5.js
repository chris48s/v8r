import JSON5 from "json5";
import { BasePlugin } from "../plugins.js";

class Json5Parser extends BasePlugin {
  static name = "v8r-plugin-json5-parser";

  registerDocumentFormats() {
    return ["json5"];
  }

  parseDocument(contents, filename, format) {
    if (format === "json5") {
      return JSON5.parse(contents);
    } else if (format == null) {
      if (filename.endsWith(".json5") || filename.endsWith(".jsonc")) {
        return JSON5.parse(contents);
      }
    }
  }
}

export default Json5Parser;
