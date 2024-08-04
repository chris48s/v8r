import { BasePlugin } from "../plugins.js";

class JsonOutput extends BasePlugin {
  static name = "v8r-plugin-json-output";

  registerOutputFormats() {
    return ["json"];
  }

  getAllResultsLogMessage(results, format) {
    if (format === "json") {
      return JSON.stringify({ results }, null, 2);
    }
  }
}

export default JsonOutput;
