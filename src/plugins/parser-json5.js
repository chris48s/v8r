import JSON5 from "json5";
import { BasePlugin } from "../plugins.js";

class Json5Parser extends BasePlugin {
  static name = "v8r-plugin-json5-parser";

  registerFileParsers() {
    return ["json5"];
  }

  parseFile(contents, fileLocation, parser) {
    if (parser === "json5") {
      return JSON5.parse(contents);
    } else if (parser == null) {
      if (fileLocation.endsWith(".json5") || fileLocation.endsWith(".jsonc")) {
        return JSON5.parse(contents);
      }
    }
  }
}

export default Json5Parser;
