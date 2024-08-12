import yaml from "js-yaml";
import { BasePlugin } from "../plugins.js";

class YamlParser extends BasePlugin {
  static name = "v8r-plugin-yaml-parser";

  registerDocumentParsers() {
    return ["yaml"];
  }

  parseDocument(contents, filename, parser) {
    if (parser === "yaml") {
      return yaml.load(contents);
    } else if (parser == null) {
      if (filename.endsWith(".yaml") || filename.endsWith(".yml")) {
        return yaml.load(contents);
      }
    }
  }
}

export default YamlParser;
