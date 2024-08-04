import assert from "assert";
import path from "path";
import {
  bootstrap,
  getDocumentFormats,
  getOutputFormats,
  parseArgs,
  preProcessConfig,
} from "./bootstrap.js";
import { loadAllPlugins } from "./plugins.js";
import { setUp, tearDown, logContainsInfo } from "./test-helpers.js";

const { allLoadedPlugins } = await loadAllPlugins([]);
const documentFormats = getDocumentFormats(allLoadedPlugins);
const outputFormats = getOutputFormats(allLoadedPlugins);

describe("parseArgs", function () {
  it("should populate default values when no args and no base config", function () {
    const args = parseArgs(
      ["node", "index.js", "infile.json"],
      { config: {} },
      documentFormats,
      outputFormats,
    );
    assert.equal(args.ignoreErrors, false);
    assert.equal(args.cacheTtl, 600);
    assert.equal(args.verbose, false);
    assert.equal(args.catalogs, undefined);
    assert.equal(args.schema, undefined);
  });

  it("should populate default values from base config when no args", function () {
    const args = parseArgs(
      ["node", "index.js"],
      {
        config: {
          patterns: ["file1.json", "file2.json"],
          ignoreErrors: true,
          cacheTtl: 300,
          verbose: 1,
        },
        filepath: "/foo/bar.yml",
      },
      documentFormats,
      outputFormats,
    );
    assert.deepStrictEqual(args.patterns, ["file1.json", "file2.json"]);
    assert.equal(args.ignoreErrors, true);
    assert.equal(args.cacheTtl, 300);
    assert.equal(args.verbose, 1);
    assert.equal(args.catalogs, undefined);
    assert.equal(args.schema, undefined);
  });

  it("should override default values when args specified and no base config", function () {
    const args = parseArgs(
      [
        "node",
        "index.js",
        "infile.json",
        "--ignore-errors",
        "--cache-ttl",
        "86400",
        "-vv",
      ],
      { config: {} },
      documentFormats,
      outputFormats,
    );
    assert.deepStrictEqual(args.patterns, ["infile.json"]);
    assert.equal(args.ignoreErrors, true);
    assert.equal(args.cacheTtl, 86400);
    assert.equal(args.verbose, 2);
    assert.equal(args.catalogs, undefined);
    assert.equal(args.schema, undefined);
  });

  it("should override default values from base config when args specified", function () {
    const args = parseArgs(
      [
        "node",
        "index.js",
        "infile.json",
        "--ignore-errors",
        "--cache-ttl",
        "86400",
        "-vv",
      ],
      {
        config: {
          patterns: ["file1.json", "file2.json"],
          ignoreErrors: false,
          cacheTtl: 300,
          verbose: 1,
        },
        filepath: "/foo/bar.yml",
      },
      documentFormats,
      outputFormats,
    );
    assert.deepStrictEqual(args.patterns, ["infile.json"]);
    assert.equal(args.ignoreErrors, true);
    assert.equal(args.cacheTtl, 86400);
    assert.equal(args.verbose, 2);
    assert.equal(args.catalogs, undefined);
    assert.equal(args.schema, undefined);
  });

  it("should accept schema param", function () {
    const args = parseArgs(
      ["node", "index.js", "infile.json", "--schema", "http://foo.bar/baz"],
      { config: {} },
      documentFormats,
      outputFormats,
    );
    assert.equal(args.schema, "http://foo.bar/baz");
  });

  it("should accept catalogs param", function () {
    const args = parseArgs(
      [
        "node",
        "index.js",
        "infile.json",
        "--catalogs",
        "catalog1.json",
        "catalog2.json",
      ],
      { config: {} },
      documentFormats,
      outputFormats,
    );
    assert.deepStrictEqual(args.catalogs, ["catalog1.json", "catalog2.json"]);
  });

  it("should accept multiple patterns", function () {
    const args = parseArgs(
      ["node", "index.js", "file1.json", "dir/*", "file2.json", "*.yaml"],
      { config: {} },
      documentFormats,
      outputFormats,
    );
    assert.deepStrictEqual(args.patterns, [
      "file1.json",
      "dir/*",
      "file2.json",
      "*.yaml",
    ]);
  });
});

describe("preProcessConfig", function () {
  it("passes through absolute paths", function () {
    const configFile = {
      config: {
        customCatalog: { schemas: [{ location: "/foo/bar/schema.json" }] },
      },
      filepath: "/home/fred/.v8rrc",
    };
    preProcessConfig(configFile);
    assert.equal(
      configFile.config.customCatalog.schemas[0].location,
      "/foo/bar/schema.json",
    );
  });

  it("passes through URLs", function () {
    const configFile = {
      config: {
        customCatalog: {
          schemas: [{ location: "https://example.com/schema.json" }],
        },
      },
      filepath: "/home/fred/.v8rrc",
    };
    preProcessConfig(configFile);
    assert.equal(
      configFile.config.customCatalog.schemas[0].location,
      "https://example.com/schema.json",
    );
  });

  it("converts relative paths to absolute", function () {
    const testCases = [
      ["schema.json", "/home/fred/schema.json"],
      ["../../schema.json", "/schema.json"],
      ["foo/bar/schema.json", "/home/fred/foo/bar/schema.json"],
    ];
    for (const testCase of testCases) {
      const configFile = {
        config: { customCatalog: { schemas: [{ location: testCase[0] }] } },
        filepath: "/home/fred/.v8rrc",
      };
      preProcessConfig(configFile);
      assert.equal(
        configFile.config.customCatalog.schemas[0].location,
        testCase[1],
      );
    }
  });
});

describe("getConfig", function () {
  beforeEach(function () {
    setUp();
  });

  afterEach(function () {
    tearDown();
  });

  it("should use defaults if no config file found", async function () {
    const { config } = await bootstrap(
      ["node", "index.js", "infile.json"],
      undefined,
      {
        searchPlaces: ["./testfiles/does-not-exist.json"],
        cache: false,
      },
    );
    assert.equal(config.ignoreErrors, false);
    assert.equal(config.cacheTtl, 600);
    assert.equal(config.verbose, 0);
    assert.equal(config.catalogs, undefined);
    assert.equal(config.schema, undefined);
    assert.equal(config.cacheName, undefined);
    assert.equal(config.customCatalog, undefined);
    assert.equal(config.configFileRelativePath, undefined);
    assert(logContainsInfo("No config file found"));
  });

  it("should read options from config file if available", async function () {
    const { config } = await bootstrap(["node", "index.js"], undefined, {
      searchPlaces: ["./testfiles/configs/config.json"],
      cache: false,
    });
    assert.equal(config.ignoreErrors, true);
    assert.equal(config.cacheTtl, 300);
    assert.equal(config.verbose, 1);
    assert.deepStrictEqual(config.patterns, ["./foobar/*.json"]);
    assert.equal(config.catalogs, undefined);
    assert.equal(config.schema, undefined);
    assert.equal(config.cacheName, undefined);
    assert.deepStrictEqual(config.customCatalog, {
      schemas: [
        {
          name: "custom schema",
          fileMatch: ["valid.json", "invalid.json"],
          location: path.resolve("./testfiles/schemas/schema.json"),
          parser: "json5",
        },
      ],
    });
    assert.equal(
      config.configFileRelativePath,
      "testfiles/configs/config.json",
    );
    assert(
      logContainsInfo("Loaded config file from testfiles/configs/config.json"),
    );
  });

  it("should override options from config file with args if specified", async function () {
    const { config } = await bootstrap(
      [
        "node",
        "index.js",
        "infile.json",
        "--ignore-errors",
        "--cache-ttl",
        "86400",
        "-vv",
      ],
      undefined,
      {
        searchPlaces: ["./testfiles/configs/config.json"],
        cache: false,
      },
    );
    assert.deepStrictEqual(config.patterns, ["infile.json"]);
    assert.equal(config.ignoreErrors, true);
    assert.equal(config.cacheTtl, 86400);
    assert.equal(config.verbose, 2);
    assert.equal(config.catalogs, undefined);
    assert.equal(config.schema, undefined);
    assert.equal(config.cacheName, undefined);
    assert.deepStrictEqual(config.customCatalog, {
      schemas: [
        {
          name: "custom schema",
          fileMatch: ["valid.json", "invalid.json"],
          location: path.resolve("./testfiles/schemas/schema.json"),
          parser: "json5",
        },
      ],
    });
    assert.equal(
      config.configFileRelativePath,
      "testfiles/configs/config.json",
    );
    assert(
      logContainsInfo("Loaded config file from testfiles/configs/config.json"),
    );
  });
});
