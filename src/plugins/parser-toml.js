import { parse } from "smol-toml";
import { BasePlugin, Document } from "../plugins.js";

class TomlParser extends BasePlugin {
  static name = "v8r-plugin-toml-parser";

  registerInputFileParsers() {
    return ["toml"];
  }

  parseInputFile(contents, fileLocation, parser) {
    if (parser === "toml") {
      return new Document(parse(contents));
    } else if (parser == null) {
      if (fileLocation.endsWith(".toml")) {
        return new Document(parse(contents));
      }
    }
  }
}

export default TomlParser;
