import { BasePlugin } from "../plugins.js";
import { formatErrors, getDocumentLocation } from "../output-formatters.js";

class TextOutput extends BasePlugin {
  static name = "v8r-plugin-text-output";

  registerOutputFormats() {
    return ["text"];
  }

  getSingleResultLogMessage(result, fileLocation, format) {
    if (result.valid === false && format === "text") {
      return formatErrors(getDocumentLocation(result), result.errors);
    }
  }
}

export default TextOutput;
