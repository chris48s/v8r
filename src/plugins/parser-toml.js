import { parse } from "smol-toml";
import { BasePlugin } from "../plugins.js";

class TomlParser extends BasePlugin {
  static name = "v8r-plugin-toml-parser";

  registerDocumentParsers() {
    return ["toml"];
  }

  parseDocument(contents, filename, parser) {
    if (parser === "toml") {
      return parse(contents);
    } else if (parser == null) {
      if (filename.endsWith(".toml")) {
        return parse(contents);
      }
    }
  }
}

export default TomlParser;
