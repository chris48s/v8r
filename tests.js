"use strict";

const chai = require("chai");
const assert = chai.assert;
const expect = chai.expect;
const nock = require("nock");
const { cli } = require("./lib.js");
chai.use(require("chai-as-promised"));

const schema = { type: "object", properties: { num: { type: "number" } } };

describe("CLI success behaviour", function () {
  let consoleLogs = [];
  let consoleErrs = [];
  const mockedLog = (output) => consoleLogs.push(output);
  const mockedErr = (output) => consoleErrs.push(output);
  const originalLog = console.log;
  const originalErr = console.error;

  beforeEach(function () {
    consoleLogs = [];
    consoleErrs = [];
    console.log = mockedLog;
    console.error = mockedErr;
  });

  afterEach(function () {
    consoleLogs = [];
    consoleErrs = [];
    console.log = originalLog;
    console.error = originalErr;
  });

  it("should return true when file is valid (with user-supplied schema)", function () {
    const mock = nock("https://example.com")
      .get("/schema.json")
      .reply(200, schema);

    return cli({
      filename: "./testfiles/valid.json",
      schema: "https://example.com/schema.json",
    }).then((result) => {
      assert.isTrue(result);
      expect(consoleLogs).to.contain("✅ ./testfiles/valid.json is valid");
      mock.done();
    });
  });

  it("should return false when file is invalid (with user-supplied schema)", function () {
    const mock = nock("https://example.com")
      .get("/schema.json")
      .reply(200, schema);

    return cli({
      filename: "./testfiles/invalid.json",
      schema: "https://example.com/schema.json",
    }).then((result) => {
      assert.isFalse(result);
      expect(consoleLogs).to.contain("❌ ./testfiles/invalid.json is invalid");
      mock.done();
    });
  });

  it("should return true when file is valid (with auto-detected schema)", function () {
    const mock1 = nock("https://www.schemastore.org")
      .get("/api/json/catalog.json")
      .reply(200, {
        schemas: [
          {
            url: "https://example.com/schema.json",
            fileMatch: ["valid.json", "invalid.json"],
          },
        ],
      });
    const mock2 = nock("https://example.com")
      .get("/schema.json")
      .reply(200, schema);

    return cli({ filename: "./testfiles/valid.json" }).then((result) => {
      assert.isTrue(result);
      expect(consoleLogs).to.contain("✅ ./testfiles/valid.json is valid");
      mock1.done();
      mock2.done();
    });
  });

  it("should return false when file is invalid (with auto-detected schema)", function () {
    const mock1 = nock("https://www.schemastore.org")
      .get("/api/json/catalog.json")
      .reply(200, {
        schemas: [
          {
            url: "https://example.com/schema.json",
            fileMatch: ["valid.json", "invalid.json"],
          },
        ],
      });
    const mock2 = nock("https://example.com")
      .get("/schema.json")
      .reply(200, schema);

    return cli({ filename: "./testfiles/invalid.json" }).then((result) => {
      assert.isFalse(result);
      expect(consoleLogs).to.contain("❌ ./testfiles/invalid.json is invalid");
      mock1.done();
      mock2.done();
    });
  });

  it("should find a schema using glob patterns", function () {
    const mock1 = nock("https://www.schemastore.org")
      .get("/api/json/catalog.json")
      .reply(200, {
        schemas: [
          {
            url: "https://example.com/schema.json",
            fileMatch: ["testfiles/*.json"],
          },
        ],
      });
    const mock2 = nock("https://example.com")
      .get("/schema.json")
      .reply(200, schema);

    return cli({ filename: "./testfiles/valid.json" }).then((result) => {
      assert.isTrue(result);
      mock1.done();
      mock2.done();
    });
  });
});

describe("CLI error handling", function () {
  let consoleLogs = [];
  let consoleErrs = [];
  const mockedLog = (output) => consoleLogs.push(output);
  const mockedErr = (output) => consoleErrs.push(output);
  const originalLog = console.log;
  const originalErr = console.error;

  beforeEach(function () {
    consoleLogs = [];
    consoleErrs = [];
    console.log = mockedLog;
    console.error = mockedErr;
  });

  afterEach(function () {
    consoleLogs = [];
    consoleErrs = [];
    console.log = originalLog;
    console.error = originalErr;
  });

  it("should throw an exception if invalid response from schemastore", async function () {
    const mock = nock("https://www.schemastore.org")
      .get("/api/json/catalog.json")
      .reply(404, {});

    await expect(
      cli({ filename: "./testfiles/valid.json" })
    ).to.be.rejectedWith(
      Error,
      "❌ Failed fetching https://www.schemastore.org/api/json/catalog.json"
    );
    mock.done();
  });

  it("should throw an exception if invalid response fetching auto-detected schema", async function () {
    const mock1 = nock("https://www.schemastore.org")
      .get("/api/json/catalog.json")
      .reply(200, {
        schemas: [
          {
            url: "https://example.com/schema.json",
            fileMatch: ["valid.json", "invalid.json"],
          },
        ],
      });
    const mock2 = nock("https://example.com")
      .get("/schema.json")
      .reply(404, {});

    await expect(
      cli({ filename: "./testfiles/valid.json" })
    ).to.be.rejectedWith(
      Error,
      "❌ Failed fetching https://example.com/schema.json"
    );

    mock1.done();
    mock2.done();
  });

  it("should throw an exception if we can't find a schema", async function () {
    const mock1 = nock("https://www.schemastore.org")
      .get("/api/json/catalog.json")
      .reply(200, {
        schemas: [
          {
            url: "https://example.com/schema.json",
            fileMatch: ["not-a-match.json"],
          },
        ],
      });

    await expect(
      cli({ filename: "./testfiles/valid.json" })
    ).to.be.rejectedWith(
      Error,
      "❌ Could not find a schema to validate ./testfiles/valid.json"
    );

    mock1.done();
  });

  it("should throw an exception if multiple schemas are matched", async function () {
    const mock1 = nock("https://www.schemastore.org")
      .get("/api/json/catalog.json")
      .reply(200, {
        schemas: [
          {
            url: "https://example.com/schema1.json",
            description: "example schema 1",
            fileMatch: ["valid.json"],
          },
          {
            url: "https://example.com/schema2.json",
            description: "example schema 2",
            fileMatch: ["testfiles/valid*"],
          },
        ],
      });

    await expect(
      cli({ filename: "./testfiles/valid.json" })
    ).to.be.rejectedWith(
      Error,
      "❌ Could not find a schema to validate ./testfiles/valid.json"
    );
    expect(consoleLogs).to.contain(
      "Found multiple possible schemas for ./testfiles/valid.json. Possible matches:"
    );
    expect(consoleLogs).to.contain(
      "example schema 1: https://example.com/schema1.json"
    );
    expect(consoleLogs).to.contain(
      "example schema 2: https://example.com/schema2.json"
    );
    mock1.done();
  });

  it("should throw an exception if invalid response fetching user-supplied schema", async function () {
    const mock = nock("https://example.com").get("/schema.json").reply(404, {});

    await expect(
      cli({
        filename: "./testfiles/valid.json",
        schema: "https://example.com/schema.json",
      })
    ).to.be.rejectedWith(
      Error,
      "❌ Failed fetching https://example.com/schema.json"
    );
    mock.done();
  });

  it("should throw an exception if local file not found", async function () {
    await expect(
      cli({ filename: "./testfiles/does-not-exist.json" })
    ).to.be.rejectedWith(
      Error,
      "ENOENT: no such file or directory, open './testfiles/does-not-exist.json'"
    );
  });

  it("should throw an exception if file type is not supported", async function () {
    await expect(
      cli({ filename: "./testfiles/not-supported.txt" })
    ).to.be.rejectedWith(Error, "❌ Unsupported format .txt");
  });
});
