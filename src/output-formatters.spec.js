import assert from "node:assert";

import { formatErrors } from "./output-formatters.js";

describe("formatErrors", function () {
  it("includes the name of additional properties in the log message", async function () {
    const errors = [
      {
        instancePath: "",
        schemaPath: "#/additionalProperties",
        keyword: "additionalProperties",
        params: { additionalProperty: "foo" },
        message: "must NOT have additional properties",
      },
    ];
    assert.equal(
      formatErrors("file.json", errors),
      "file.json# must NOT have additional properties, found additional property 'foo'\n",
    );
  });
});
