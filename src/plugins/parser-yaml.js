import yaml from "js-yaml";
import { BasePlugin } from "../plugins.js";

class YamlParser extends BasePlugin {
  static name = "v8r-plugin-yaml-parser";

  registerFileParsers() {
    return ["yaml"];
  }

  parseFile(contents, fileLocation, parser) {
    if (parser === "yaml") {
      return yaml.load(contents);
    } else if (parser == null) {
      if (fileLocation.endsWith(".yaml") || fileLocation.endsWith(".yml")) {
        return yaml.load(contents);
      }
    }
  }
}

export default YamlParser;
