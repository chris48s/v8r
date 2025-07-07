import assert from "node:assert";
import { FlatCache } from "flat-cache";
import nock from "nock";
import { Cache } from "./cache.js";
import {
  getRemoteRefs,
  prewarmSchemaCache,
  resolveUrl,
} from "./cache-prewarm.js";
import { testCacheName, setUp, tearDown } from "./test-helpers.js";

const schemaWithRefs = {
  $id: "example.json#",
  $schema: "http://json-schema.org/draft-06/schema#",
  type: "object",
  properties: {
    absolute: {
      $ref: "https://foo.bar/absolute.json",
    },
    relative: {
      $ref: "relative.json",
    },
    list: {
      type: "array",
      items: {
        $ref: "relative.json",
      },
    },
  },
};

describe("resolveUrl", function () {
  it("resolves relative references against base URLs", function () {
    const testCases = [
      // [base, ref, expected]
      [
        "https://example.com/foo/bar.json",
        "baz.json",
        "https://example.com/foo/baz.json",
      ],
      [
        "https://example.com/foo/bar.json",
        "./baz.json",
        "https://example.com/foo/baz.json",
      ],
      [
        "https://example.com/foo/bar.json",
        "../baz.json",
        "https://example.com/baz.json",
      ],
      [
        "https://example.com/foo/bar.json",
        "#section",
        "https://example.com/foo/bar.json#section",
      ],
      [
        "https://example.com/foo/bar.json",
        "/baz.json",
        "https://example.com/baz.json",
      ],
      [
        "https://example.com/foo/bar.json",
        "https://other.com/x.json",
        "https://other.com/x.json",
      ],
      [
        "https://example.com/foo/bar.json#frag",
        "baz.json",
        "https://example.com/foo/baz.json",
      ],
      [
        "https://example.com/foo/",
        "baz.json",
        "https://example.com/foo/baz.json",
      ],
      [
        "https://example.com/foo", //
        "baz.json",
        "https://example.com/baz.json",
      ],
      [
        "https://example.com/foo/bar.json",
        "",
        "https://example.com/foo/bar.json",
      ],
    ];
    for (const [base, ref, expected] of testCases) {
      assert.equal(resolveUrl(base, ref), expected);
    }
  });

  it("returns null for invalid URLs", function () {
    assert.equal(resolveUrl("not a url", "baz.json"), null);
    assert.equal(resolveUrl(null, "baz.json"), null);
  });
});

describe("getRemoteRefs", function () {
  it("extracts expected refs from input schema", function () {
    const refs = getRemoteRefs(schemaWithRefs, "https://example.com");
    assert.equal(refs.length, 2);
    assert(refs.includes("https://foo.bar/absolute.json"));
    assert(refs.includes("https://example.com/relative.json"));
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
  });

  afterEach(function () {
    tearDown();
    nock.cleanAll();
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
        .get("/absolute.json")
        .reply(200, { "doesn't": "matter" }),
      nock("https://example.com")
        .get("/relative.json")
        .reply(200, { "doesn't": "matter" }),
    ];

    await prewarmSchemaCache(["document.json"], {}, testCache);

    assert(testCache.cache.keys(), 5);
    assert(
      testCache.cache.get("https://json.schemastore.org/schema-catalog.json"),
    );
    assert(
      testCache.cache.get("https://www.schemastore.org/api/json/catalog.json"),
    );
    assert(testCache.cache.get("https://example.com/schema.json"));
    assert(testCache.cache.get("https://example.com/relative.json"));
    assert(testCache.cache.get("https://foo.bar/absolute.json"));

    for (const mock of mocks) {
      mock.done();
    }
  });
});
