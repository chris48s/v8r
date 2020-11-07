const chai = require("chai");
const assert = chai.assert;
const expect = chai.expect;
const nock = require("nock");
const { cli } = require("./lib.js");
chai.use(require("chai-as-promised"));

const schema = { type: "object", properties: { num: { type: "number" } } };

describe("CLI success behaviour", function () {
  it("should return true when file is valid (with user-supplied schema)", function () {
    const mock = nock("https://example.com")
      .get("/schema.json")
      .reply(200, schema);

    return cli([
      null,
      null,
      "./testfiles/valid.json",
      "https://example.com/schema.json",
    ]).then((result) => {
      assert.isTrue(result);
      mock.done();
    });
  });

  it("should return false when file is invalid (with user-supplied schema)", function () {
    const mock = nock("https://example.com")
      .get("/schema.json")
      .reply(200, schema);

    return cli([
      null,
      null,
      "./testfiles/invalid.json",
      "https://example.com/schema.json",
    ]).then((result) => {
      assert.isFalse(result);
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

    return cli([null, null, "./testfiles/valid.json"]).then((result) => {
      assert.isTrue(result);
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

    return cli([null, null, "./testfiles/invalid.json"]).then((result) => {
      assert.isFalse(result);
      mock1.done();
      mock2.done();
    });
  });
});

describe("CLI error handling", function () {
  it("should throw an exception if invalid response from schemastore", async function () {
    const mock = nock("https://www.schemastore.org")
      .get("/api/json/catalog.json")
      .reply(404, {});

    await expect(
      cli([null, null, "./testfiles/valid.json"])
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
      cli([null, null, "./testfiles/valid.json"])
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
      cli([null, null, "./testfiles/valid.json"])
    ).to.be.rejectedWith(
      Error,
      "❌ Could not find a schema to validate valid.json"
    );

    mock1.done();
  });

  it("should throw an exception if invalid response fetching user-supplied schema", async function () {
    const mock = nock("https://example.com").get("/schema.json").reply(404, {});

    await expect(
      cli([
        null,
        null,
        "./testfiles/valid.json",
        "https://example.com/schema.json",
      ])
    ).to.be.rejectedWith(
      Error,
      "❌ Failed fetching https://example.com/schema.json"
    );
    mock.done();
  });

  it("should throw an exception if local file not found", async function () {
    await expect(
      cli([null, null, "./testfiles/does-not-exist.json"])
    ).to.be.rejectedWith(
      Error,
      "ENOENT: no such file or directory, open './testfiles/does-not-exist.json'"
    );
  });

  it("should throw an exception if file type is not supported", async function () {
    await expect(
      cli([null, null, "./testfiles/not-supported.txt"])
    ).to.be.rejectedWith(Error, "❌ Unsupported format .txt");
  });
});
