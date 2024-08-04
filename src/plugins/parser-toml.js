import { parse } from "smol-toml";
import { BasePlugin } from "../plugins.js";

class TomlParser extends BasePlugin {
  static name = "v8r-plugin-toml-parser";

  registerDocumentFormats() {
    return ["toml"];
  }

  parseDocument(contents, filename, format) {
    if (format === "toml") {
      return parse(contents);
    } else if (format == null) {
      if (filename.endsWith(".toml")) {
        return parse(contents);
      }
    }
  }
}

export default TomlParser;
