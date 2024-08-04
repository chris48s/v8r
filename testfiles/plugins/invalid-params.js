import { BasePlugin } from "v8r";

export default class InvalidParamsTestPlugin extends BasePlugin {
  static name = "v8r-plugin-test-invalid-params";

  // eslint-disable-next-line no-unused-vars
  registerDocumentFormats(foo) {
    return [];
  }
}
