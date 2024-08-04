import { BasePlugin } from "../plugins.js";
import { formatErrors } from "../output-formatters.js";

class TextOutput extends BasePlugin {
  static name = "v8r-plugin-text-output";

  registerOutputFormats() {
    return ["text"];
  }

  getSingleResultLogMessage(result, filename, format) {
    if (result.valid === false && format === "text") {
      return formatErrors(filename, result.errors);
    }
  }
}

export default TextOutput;
