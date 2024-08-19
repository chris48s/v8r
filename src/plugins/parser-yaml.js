import yaml from "js-yaml";
import { BasePlugin, Document } from "../plugins.js";

class YamlParser extends BasePlugin {
  static name = "v8r-plugin-yaml-parser";

  registerInputFileParsers() {
    return ["yaml"];
  }

  parseInputFile(contents, fileLocation, parser) {
    if (parser === "yaml") {
      return new Document(yaml.load(contents));
    } else if (parser == null) {
      if (fileLocation.endsWith(".yaml") || fileLocation.endsWith(".yml")) {
        return new Document(yaml.load(contents));
      }
    }
  }
}

export default YamlParser;
