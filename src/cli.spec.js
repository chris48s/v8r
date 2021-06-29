"use strict";

const chai = require("chai");
const assert = chai.assert;
const expect = chai.expect;
const nock = require("nock");
const { cli, parseArgs } = require("./cli.js");
const { setUp, tearDown } = require("./test-helpers.js");
chai.use(require("chai-as-promised"));

describe("CLI", function () {
  describe("success behaviour", function () {
    const messages = {};
    const schema = { type: "object", properties: { num: { type: "number" } } };
    beforeEach(() => setUp(messages));
    afterEach(() => tearDown());

    it("should return 0 when file is valid (user-supplied local schema)", function () {
      return cli({
        filename: "./testfiles/valid.json",
        schema: "./testfiles/schema.json",
      }).then((result) => {
        assert.equal(0, result);
        expect(messages.log).to.contain("✅ ./testfiles/valid.json is valid");
      });
    });

    it("should return 99 when file is invalid (user-supplied local schema)", function () {
      return cli({
        filename: "./testfiles/invalid.json",
        schema: "./testfiles/schema.json",
      }).then((result) => {
        assert.equal(99, result);
        expect(messages.log).to.contain(
          "❌ ./testfiles/invalid.json is invalid"
        );
      });
    });

    it("should return 0 when file is valid (with user-supplied remote schema)", function () {
      const mock = nock("https://example.com")
        .get("/schema.json")
        .reply(200, schema);

      return cli({
        filename: "./testfiles/valid.json",
        schema: "https://example.com/schema.json",
      }).then((result) => {
        assert.equal(0, result);
        expect(messages.log).to.contain("✅ ./testfiles/valid.json is valid");
        mock.done();
      });
    });

    it("should return 99 when file is invalid (with user-supplied remote schema)", function () {
      const mock = nock("https://example.com")
        .get("/schema.json")
        .reply(200, schema);

      return cli({
        filename: "./testfiles/invalid.json",
        schema: "https://example.com/schema.json",
      }).then((result) => {
        assert.equal(99, result);
        expect(messages.log).to.contain(
          "❌ ./testfiles/invalid.json is invalid"
        );
        mock.done();
      });
    });

    it("should return 0 when file is valid (with auto-detected schema)", function () {
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
        assert.equal(0, result);
        expect(messages.log).to.contain("✅ ./testfiles/valid.json is valid");
        mock1.done();
        mock2.done();
      });
    });

    it("should return 99 when file is invalid (with auto-detected schema)", function () {
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
        assert.equal(99, result);
        expect(messages.log).to.contain(
          "❌ ./testfiles/invalid.json is invalid"
        );
        mock1.done();
        mock2.done();
      });
    });

    it("should return 0 when file is valid (with inlined-detected schema)", function () {
      const mock = nock("https://example.com")
        .get("/specific-schema.json")
        .reply(200, schema);

      return cli({ filename: "./testfiles/inlined.yaml" }).then((result) => {
        assert.equal(0, result);
        expect(messages.log).to.contain("✅ ./testfiles/inlined.yaml is valid");
        mock.done();
      });
    });

    it("should return 99 when file is invalid (with inlined-detected schema)", function () {
      const mock = nock("https://example.com")
        .get("/wrong-schema.json")
        .reply(200, {
          type: "object",
          properties: { num: { type: "object" } },
        });

      return cli({ filename: "./testfiles/invalid-inlined.yaml" }).then(
        (result) => {
          assert.equal(99, result);
          expect(messages.log).to.contain(
            "❌ ./testfiles/invalid-inlined.yaml is invalid"
          );
          mock.done();
        }
      );
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
        assert.equal(0, result);
        mock1.done();
        mock2.done();
      });
    });

    it("should validate yaml files", function () {
      return cli({
        filename: "./testfiles/valid.yaml",
        schema: "./testfiles/schema.json",
      }).then((result) => {
        assert.equal(0, result);
        expect(messages.log).to.contain("✅ ./testfiles/valid.yaml is valid");
      });
    });
  });

  describe("error handling", function () {
    const messages = {};
    beforeEach(() => setUp(messages));
    afterEach(() => tearDown());

    it("should return 1 if invalid response from schemastore", async function () {
      const mock = nock("https://www.schemastore.org")
        .get("/api/json/catalog.json")
        .reply(404, {});

      return cli({ filename: "./testfiles/valid.json" }).then((result) => {
        assert.equal(1, result);
        expect(messages.error[0]).to.contain(
          "❌ Failed fetching https://www.schemastore.org/api/json/catalog.json"
        );
        mock.done();
      });
    });

    it("should return 1 if invalid response fetching auto-detected schema", async function () {
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

      return cli({ filename: "./testfiles/valid.json" }).then((result) => {
        assert.equal(1, result);
        expect(messages.error[0]).to.contain(
          "❌ Failed fetching https://example.com/schema.json"
        );
        mock1.done();
        mock2.done();
      });
    });

    it("should return 1 if we can't find a schema", async function () {
      const mock = nock("https://www.schemastore.org")
        .get("/api/json/catalog.json")
        .reply(200, {
          schemas: [
            {
              url: "https://example.com/schema.json",
              fileMatch: ["not-a-match.json"],
            },
          ],
        });

      return cli({ filename: "./testfiles/valid.json" }).then((result) => {
        assert.equal(1, result);
        expect(messages.error).to.contain(
          "❌ Could not find a schema to validate ./testfiles/valid.json"
        );
        mock.done();
      });
    });

    it("should return 1 if multiple schemas are matched", async function () {
      const mock = nock("https://www.schemastore.org")
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

      return cli({ filename: "./testfiles/valid.json" }).then((result) => {
        assert.equal(1, result);
        expect(messages.error).to.contain(
          "❌ Could not find a schema to validate ./testfiles/valid.json"
        );
        expect(messages.log).to.contain(
          "Found multiple possible schemas for ./testfiles/valid.json. Possible matches:"
        );
        expect(messages.log).to.contain(
          "example schema 1: https://example.com/schema1.json"
        );
        expect(messages.log).to.contain(
          "example schema 2: https://example.com/schema2.json"
        );
        mock.done();
      });
    });

    it("should return 1 if invalid response fetching user-supplied schema", async function () {
      const mock = nock("https://example.com")
        .get("/schema.json")
        .reply(404, {});

      return cli({
        filename: "./testfiles/valid.json",
        schema: "https://example.com/schema.json",
      }).then((result) => {
        assert.equal(1, result);
        expect(messages.error[0]).to.contain(
          "❌ Failed fetching https://example.com/schema.json"
        );
        mock.done();
      });
    });

    it("should return 1 if local target file not found", async function () {
      return cli({ filename: "./testfiles/does-not-exist.json" }).then(
        (result) => {
          assert.equal(1, result);
          expect(messages.error).to.contain(
            "ENOENT: no such file or directory, open './testfiles/does-not-exist.json'"
          );
        }
      );
    });

    it("should return 1 if target file type is not supported", async function () {
      return cli({ filename: "./testfiles/not-supported.txt" }).then(
        (result) => {
          assert.equal(1, result);
          expect(messages.error).to.contain("❌ Unsupported format .txt");
        }
      );
    });

    it("should return 1 if local schema file not found", async function () {
      return cli({
        filename: "./testfiles/valid.json",
        schema: "./testfiles/does-not-exist.json",
      }).then((result) => {
        assert.equal(1, result);
        expect(messages.error).to.contain(
          "ENOENT: no such file or directory, open './testfiles/does-not-exist.json'"
        );
      });
    });

    it("should return 0 if ignore-errors flag is passed", async function () {
      return cli({
        filename: "./testfiles/not-supported.txt",
        ignoreErrors: true,
      }).then((result) => {
        assert.equal(0, result);
        expect(messages.error).to.contain("❌ Unsupported format .txt");
      });
    });
  });
});

describe("Argument parser", function () {
  it("should populate default params when not specified", function () {
    const args = parseArgs(["node", "index.js", "infile.json"]);
    expect(args).to.have.property("ignoreErrors", false);
    expect(args).to.have.property("cacheTtl", 600);
    expect(args).to.have.property("verbose", 0);
    expect(args).to.not.have.property("schema");
  });

  it("should override default params when specified", function () {
    const args = parseArgs([
      "node",
      "index.js",
      "infile.json",
      "--ignore-errors",
      "--cache-ttl",
      "86400",
      "-vv",
    ]);
    expect(args).to.have.property("ignoreErrors", true);
    expect(args).to.have.property("cacheTtl", 86400);
    expect(args).to.have.property("verbose", 2);
    expect(args).to.not.have.property("schema");
  });

  it("should accept schema param", function () {
    const args = parseArgs([
      "node",
      "index.js",
      "infile.json",
      "--schema",
      "http://foo.bar/baz",
    ]);
    expect(args).to.have.property("schema", "http://foo.bar/baz");
  });
});
