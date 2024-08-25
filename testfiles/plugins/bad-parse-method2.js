import { BasePlugin, Document } from "v8r";

export default class BadParseMethod2TestPlugin extends BasePlugin {
  static name = "v8r-plugin-test-bad-parse-method";

  // eslint-disable-next-line no-unused-vars
  parseInputFile(contents, fileLocation, parser) {
    // if we are returning an array
    // all objects in the array should be a Document
    return [new Document({}), "foobar"];
  }
}
