import assert from "assert";
import flatCache from "flat-cache";
import { Cache } from "./cache.js";
import {
  getMatchForFilename,
  getSchemaMatchesForFilename,
} from "./catalogs.js";
import {
  testCacheName,
  setUp,
  tearDown,
  logContainsInfo,
} from "./test-helpers.js";

describe("getSchemaMatchesForFilename", function () {
  const schemas = [
    {
      url: "https://example.com/subdir-schema.json",
      fileMatch: ["subdir/**/*.json"],
    },
    {
      url: "https://example.com/files-schema-schema.json",
      fileMatch: ["file1.json", "file2.json"],
    },
    {
      url: "https://example.com/duplicate.json",
      fileMatch: ["file2.json"],
    },
    {
      url: "https://example.com/starts-with-a-dot-schema.json",
      fileMatch: ["*.starts-with-a-dot.json"],
    },
  ];

  it("returns [] when no matches found", function () {
    assert.deepStrictEqual(
      getSchemaMatchesForFilename(schemas, "doesnt-match-anything.json"),
      [],
    );
  });

  it("returns a match using globstar pattern", function () {
    assert.deepStrictEqual(
      getSchemaMatchesForFilename(schemas, "subdir/one/two/three/file.json"),
      [
        {
          url: "https://example.com/subdir-schema.json",
          fileMatch: ["subdir/**/*.json"],
        },
      ],
    );
  });

  it("returns a match when fileMatch contains multiple patterns", function () {
    assert.deepStrictEqual(getSchemaMatchesForFilename(schemas, "file1.json"), [
      {
        url: "https://example.com/files-schema-schema.json",
        fileMatch: ["file1.json", "file2.json"],
      },
    ]);
  });

  it("returns multiple matches if input matches >1 globs", function () {
    assert.deepStrictEqual(getSchemaMatchesForFilename(schemas, "file2.json"), [
      {
        url: "https://example.com/files-schema-schema.json",
        fileMatch: ["file1.json", "file2.json"],
      },
      {
        url: "https://example.com/duplicate.json",
        fileMatch: ["file2.json"],
      },
    ]);
  });

  it("returns a match if filename starts with a dot", function () {
    assert.deepStrictEqual(
      getSchemaMatchesForFilename(schemas, ".starts-with-a-dot.json"),
      [
        {
          url: "https://example.com/starts-with-a-dot-schema.json",
          fileMatch: ["*.starts-with-a-dot.json"],
        },
      ],
    );
  });
});

describe("getMatchForFilename", function () {
  const catalogs = [
    {
      catalog: {
        schemas: [
          {
            url: "https://example.com/files-schema-schema.json",
            fileMatch: ["file1.json", "file2.json"],
          },
          {
            url: "https://example.com/duplicate.json",
            fileMatch: ["file2.json"],
          },
          {
            url: "https://example.com/v1.json",
            fileMatch: ["one-version.json"],
            versions: {
              "v1.0": "https://example.com/v1.json",
            },
          },
          {
            url: "https://example.com/versions-v2.json",
            fileMatch: ["versions.json"],
            versions: {
              "v1.0": "https://example.com/versions-v1.json",
              "v2.0": "https://example.com/versions-v2.json",
            },
          },
        ],
      },
    },
  ];
  const testCache = new Cache(flatCache.load(testCacheName), 3000);
  beforeEach(() => setUp());
  afterEach(() => tearDown());

  it("returns a schema when one match found", async function () {
    assert.deepStrictEqual(
      await getMatchForFilename(catalogs, "file1.json", testCache),
      {
        location: "https://example.com/files-schema-schema.json",
        fileMatch: ["file1.json", "file2.json"],
      },
    );
  });

  it("returns a schema when match has only one version", async function () {
    assert.deepStrictEqual(
      await getMatchForFilename(catalogs, "one-version.json", testCache),
      {
        location: "https://example.com/v1.json",
        fileMatch: ["one-version.json"],
        versions: {
          "v1.0": "https://example.com/v1.json",
        },
      },
    );
  });

  it("throws an exception when no matches found", async function () {
    await assert.rejects(
      getMatchForFilename(catalogs, "doesnt-match-anything.json", testCache),
      {
        name: "Error",
        message:
          "Could not find a schema to validate doesnt-match-anything.json",
      },
    );
  });

  it("throws an exception when multiple matches found", async function () {
    await assert.rejects(
      getMatchForFilename(catalogs, "file2.json", testCache),
      {
        name: "Error",
        message: "Found multiple possible schemas to validate file2.json",
      },
    );

    assert(logContainsInfo("Found multiple possible matches for file2.json"));
    assert(logContainsInfo("https://example.com/files-schema-schema.json"));
    assert(logContainsInfo("https://example.com/duplicate.json"));
  });

  it("throws an exception when match has multiple versions", async function () {
    await assert.rejects(
      getMatchForFilename(catalogs, "versions.json", testCache),
      {
        name: "Error",
        message: "Found multiple possible schemas to validate versions.json",
      },
    );

    assert(
      logContainsInfo("Found multiple possible matches for versions.json"),
    );
    assert(logContainsInfo("https://example.com/versions-v1.json"));
    assert(logContainsInfo("https://example.com/versions-v2.json"));
  });
});
