import { parse } from "smol-toml";
import { BasePlugin } from "../plugins.js";

class TomlParser extends BasePlugin {
  static name = "v8r-plugin-toml-parser";

  registerFileParsers() {
    return ["toml"];
  }

  parseFile(contents, fileLocation, parser) {
    if (parser === "toml") {
      return parse(contents);
    } else if (parser == null) {
      if (fileLocation.endsWith(".toml")) {
        return parse(contents);
      }
    }
  }
}

export default TomlParser;
