import yaml from "js-yaml";
import { BasePlugin } from "../plugins.js";

class YamlParser extends BasePlugin {
  static name = "v8r-plugin-yaml-parser";

  registerDocumentFormats() {
    return ["yaml"];
  }

  parseDocument(contents, filename, format) {
    if (format === "yaml") {
      return yaml.load(contents);
    } else if (format == null) {
      if (filename.endsWith(".yaml") || filename.endsWith(".yml")) {
        return yaml.load(contents);
      }
    }
  }
}

export default YamlParser;
