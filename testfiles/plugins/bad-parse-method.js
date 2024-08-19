import { BasePlugin } from "v8r";

export default class ValidTestPlugin extends BasePlugin {
  static name = "v8r-plugin-test-bad-parse-method";

  // eslint-disable-next-line no-unused-vars
  parseInputFile(contents, fileLocation, parser) {
    // this method returns something other than a Document object,
    // which should cause a failure
    return { foo: "bar" };
  }
}
