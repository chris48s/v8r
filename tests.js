"use strict";

const chai = require("chai");
const assert = chai.assert;
const expect = chai.expect;
const flatCache = require("flat-cache");
const nock = require("nock");
const { cachedFetch, Cli } = require("./lib.js");
chai.use(require("chai-as-promised"));

const schema = { type: "object", properties: { num: { type: "number" } } };
const consoleMethods = ["log", "error", "debug"];
const testCacheName = "v8r-test";

describe("CLI success behaviour", function () {
  const messages = {};
  const originals = {};
  const cache = flatCache.load(testCacheName);
  const cli = Cli({ cache });

  beforeEach(function () {
    flatCache.clearCacheById(testCacheName);
    consoleMethods.forEach(function (fn) {
      messages[fn] = [];
      originals[fn] = console[fn];
      console[fn] = (msg) => messages[fn].push(msg);
    });
  });

  afterEach(function () {
    flatCache.clearCacheById(testCacheName);
    consoleMethods.forEach(function (fn) {
      console[fn] = originals[fn];
    });
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
      expect(messages.log).to.contain("✅ ./testfiles/valid.json is valid");
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
      expect(messages.log).to.contain("❌ ./testfiles/invalid.json is invalid");
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
      expect(messages.log).to.contain("✅ ./testfiles/valid.json is valid");
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
      expect(messages.log).to.contain("❌ ./testfiles/invalid.json is invalid");
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
  const messages = {};
  const originals = {};
  const cache = flatCache.load(testCacheName);
  const cli = Cli({ cache });

  beforeEach(function () {
    flatCache.clearCacheById(testCacheName);
    consoleMethods.forEach(function (fn) {
      messages[fn] = [];
      originals[fn] = console[fn];
      console[fn] = (msg) => messages[fn].push(msg);
    });
  });

  afterEach(function () {
    flatCache.clearCacheById(testCacheName);
    consoleMethods.forEach(function (fn) {
      console[fn] = originals[fn];
    });
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
    expect(messages.log).to.contain(
      "Found multiple possible schemas for ./testfiles/valid.json. Possible matches:"
    );
    expect(messages.log).to.contain(
      "example schema 1: https://example.com/schema1.json"
    );
    expect(messages.log).to.contain(
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

describe("fetch function", function () {
  const messages = {};
  const originals = {};
  const cache = flatCache.load(testCacheName);

  beforeEach(function () {
    flatCache.clearCacheById(testCacheName);
    consoleMethods.forEach(function (fn) {
      messages[fn] = [];
      originals[fn] = console[fn];
      console[fn] = (msg) => messages[fn].push(msg);
    });
  });

  afterEach(function () {
    flatCache.clearCacheById(testCacheName);
    consoleMethods.forEach(function (fn) {
      console[fn] = originals[fn];
    });
  });

  it("should use cached response if valid", async function () {
    const mock = nock("https://www.foobar.com")
      .get("/baz")
      .reply(200, { cached: false });

    cache.setKey("https://www.foobar.com/baz", {
      timestamp: Date.now(),
      body: { cached: true },
    });
    const resp = await cachedFetch("https://www.foobar.com/baz", cache, 3000);
    assert.deepEqual(resp, { cached: true });
    nock.cleanAll();
  });

  it("should not use cached response if expired", async function () {
    const mock = nock("https://www.foobar.com")
      .get("/baz")
      .reply(200, { cached: false });

    cache.setKey("https://www.foobar.com/baz", {
      timestamp: Date.now() - 3001,
      body: { cached: true },
    });
    const resp = await cachedFetch("https://www.foobar.com/baz", cache, 3000);
    assert.deepEqual(resp, { cached: false });
    mock.done();
  });
});
