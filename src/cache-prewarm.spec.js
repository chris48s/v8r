import assert from "node:assert";
import { FlatCache } from "flat-cache";
import nock from "nock";
import { Cache } from "./cache.js";
import {
  getRemoteRefs,
  prewarmSchemaCache,
  normalizeUrl,
} from "./cache-prewarm.js";
import { testCacheName, setUp, tearDown } from "./test-helpers.js";

const schemaWithRefs = {
  $id: "example.json#",
  $schema: "http://json-schema.org/draft-06/schema#",
  type: "object",
  properties: {
    p1: {
      $ref: "https://foo.bar/one.json",
    },
    p2: {
      type: "array",
      items: {
        $ref: "https://foo.bar/one.json#anchor",
      },
    },
    p3: {
      oneOf: [
        { $ref: "https://foo.bar/two.json" },
        { $ref: "https://foo.bar/three.json" },
      ],
    },
  },
};

describe("normalizeUrl", function () {
  it("normalizes valid URLs", function () {
    const testCases = [
      [
        "https://example.com/foo/bar.json", //
        "https://example.com/foo/bar.json",
      ],
      [
        "https://example.com/foo/bar.json#section",
        "https://example.com/foo/bar.json",
      ],
    ];
    for (const [ref, expected] of testCases) {
      assert.equal(normalizeUrl(ref), expected);
    }
  });

  it("returns null for invalid URLs", function () {
    const testCases = [
      "./baz.json",
      "../baz.json",
      "#section",
      "/baz.json",
      "baz.json",
      "",
      null,
    ];
    for (const ref of testCases) {
      assert.equal(normalizeUrl(ref), null);
    }
  });
});

describe("getRemoteRefs", function () {
  it("extracts expected refs from input schema", function () {
    const refs = getRemoteRefs(schemaWithRefs, "https://example.com");
    assert.strictEqual(refs.length, 3);
    assert(refs.includes("https://foo.bar/one.json"));
    assert(refs.includes("https://foo.bar/two.json"));
    assert(refs.includes("https://foo.bar/three.json"));
  });

  it("extracts nothing from schemas with no refs", function () {
    assert.deepEqual(getRemoteRefs({}, "https://example.com"), []);

    const schema = {
      $id: "example.json#",
      $schema: "http://json-schema.org/draft-06/schema#",
      type: "object",
      required: ["version"],
      properties: {
        version: {
          type: "string",
        },
        comment: {
          type: "string",
        },
      },
    };
    assert.deepEqual(getRemoteRefs(schema, "https://example.com"), []);
  });
});

describe("prewarmSchemaCache", function () {
  let testCache;

  before(function () {
    const ttl = 500;
    const cache = new FlatCache({ cacheId: testCacheName, ttl: ttl });
    cache.load();
    testCache = new Cache(cache);
  });

  beforeEach(function () {
    setUp();
    testCache.cache.clear();
  });

  afterEach(function () {
    tearDown();
    testCache.cache.clear();
    nock.cleanAll();
  });

  after(function () {
    testCache.cache.destroy();
  });

  it("populates cache with all expected URLs", async function () {
    nock.disableNetConnect();
    const mocks = [
      nock("https://json.schemastore.org")
        .persist()
        .get("/schema-catalog.json")
        .reply(200, {
          $schema: "http://json-schema.org/draft-07/schema#",
          type: "object",
          properties: {
            schemas: {
              type: "array",
              items: {
                type: "object",
                required: ["url"],
                properties: {
                  url: {
                    type: "string",
                    format: "uri",
                    pattern: "^https://",
                  },
                },
              },
            },
          },
        }),
      nock("https://www.schemastore.org")
        .get("/api/json/catalog.json")
        .reply(200, {
          schemas: [
            {
              url: "https://example.com/schema.json",
              fileMatch: ["document.json"],
            },
          ],
        }),
      nock("https://example.com")
        .get("/schema.json")
        .reply(200, schemaWithRefs),
      nock("https://foo.bar")
        .get("/one.json")
        .reply(200, { "doesn't": "matter" }),
      nock("https://foo.bar")
        .get("/two.json")
        .reply(200, { "doesn't": "matter" }),
      nock("https://foo.bar")
        .get("/three.json")
        .reply(200, { "doesn't": "matter" }),
    ];

    await prewarmSchemaCache(["document.json"], {}, testCache);

    assert.strictEqual(testCache.cache.keys().length, 6);
    assert(
      testCache.cache.get("https://json.schemastore.org/schema-catalog.json"),
    );
    assert(
      testCache.cache.get("https://www.schemastore.org/api/json/catalog.json"),
    );
    assert(testCache.cache.get("https://example.com/schema.json"));
    assert(testCache.cache.get("https://foo.bar/one.json"));
    assert(testCache.cache.get("https://foo.bar/two.json"));
    assert(testCache.cache.get("https://foo.bar/three.json"));

    for (const mock of mocks) {
      mock.done();
    }
  });

  it("mitigates circular references", async function () {
    nock.disableNetConnect();

    const schemaMock = nock("https://example.com")
      .get("/schema.json")
      .times(1) // expect this URL to be called only once
      .reply(200, {
        $id: "example.json#",
        $schema: "http://json-schema.org/draft-06/schema#",
        type: "object",
        properties: {
          p1: {
            $ref: "https://example.com/schema.json",
          },
        },
      });

    const mocks = [
      nock("https://json.schemastore.org")
        .persist()
        .get("/schema-catalog.json")
        .reply(200, {
          $schema: "http://json-schema.org/draft-07/schema#",
          type: "object",
          properties: {
            schemas: {
              type: "array",
              items: {
                type: "object",
                required: ["url"],
                properties: {
                  url: {
                    type: "string",
                    format: "uri",
                    pattern: "^https://",
                  },
                },
              },
            },
          },
        }),
      nock("https://www.schemastore.org")
        .get("/api/json/catalog.json")
        .reply(200, {
          schemas: [
            {
              url: "https://example.com/schema.json",
              fileMatch: ["document.json"],
            },
          ],
        }),
      schemaMock,
    ];

    await prewarmSchemaCache(["document.json"], {}, testCache);

    assert.strictEqual(testCache.cache.keys().length, 3);

    for (const mock of mocks) {
      mock.done();
    }
  });
});
