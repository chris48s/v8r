import assert from "assert";
import path from "path";
import {
  getConfig,
  parseArgs,
  preProcessConfig,
  validateConfig,
} from "./config.js";
import { setUp, tearDown, logContainsInfo } from "./test-helpers.js";

describe("parseArgs", function () {
  it("should populate default values when no args and no base config", function () {
    const args = parseArgs(["node", "index.js", "infile.json"], { config: {} });
    assert.equal(args.ignoreErrors, false);
    assert.equal(args.cacheTtl, 600);
    assert.equal(args.verbose, false);
    assert.equal(args.catalogs, undefined);
    assert.equal(args.schema, undefined);
  });

  it("should populate default values from base config when no args", function () {
    const args = parseArgs(["node", "index.js"], {
      config: {
        patterns: ["file1.json", "file2.json"],
        ignoreErrors: true,
        cacheTtl: 300,
        verbose: 1,
      },
      filepath: "/foo/bar.yml",
    });
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
    );
    assert.deepStrictEqual(args.catalogs, ["catalog1.json", "catalog2.json"]);
  });

  it("should accept multiple patterns", function () {
    const args = parseArgs(
      ["node", "index.js", "file1.json", "dir/*", "file2.json", "*.yaml"],
      { config: {} },
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
    const config = await getConfig(["node", "index.js", "infile.json"], {
      searchPlaces: ["./testfiles/does-not-exist.json"],
      cache: false,
    });
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
    const config = await getConfig(["node", "index.js"], {
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
    const config = await getConfig(
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

describe("validateConfig", function () {
  const messages = {};

  beforeEach(function () {
    setUp(messages);
  });

  afterEach(function () {
    tearDown();
  });

  it("should pass valid configs", function () {
    const validConfigs = [
      { config: {} },
      {
        config: {
          ignoreErrors: true,
          verbose: 0,
          patterns: ["foobar.js"],
          cacheTtl: 600,
          format: "json",
          customCatalog: {
            schemas: [
              {
                name: "Schema 1",
                fileMatch: ["file1.json"],
                location: "localschema.json",
              },
              {
                name: "Schema 2",
                description: "Long Description",
                fileMatch: ["file2.json"],
                location: "https://example.com/remoteschema.json",
                parser: "json5",
              },
            ],
          },
        },
      },
    ];
    for (const config of validConfigs) {
      assert(validateConfig(config));
    }
  });

  it("should reject invalid configs", function () {
    const invalidConfigs = [
      { config: { ignoreErrors: "string" } },
      { config: { foo: "bar" } },
      { config: { verbose: "string" } },
      { config: { verbose: -1 } },
      { config: { patterns: "string" } },
      { config: { patterns: [] } },
      { config: { patterns: ["valid", "ok", false] } },
      { config: { patterns: ["duplicate", "duplicate"] } },
      { config: { cacheTtl: "string" } },
      { config: { cacheTtl: -1 } },
      { config: { format: "invalid" } },
      { config: { customCatalog: "string" } },
      { config: { customCatalog: {} } },
      { config: { customCatalog: { schemas: [{}] } } },
      {
        config: {
          customCatalog: {
            schemas: [
              {
                name: "Schema 1",
                fileMatch: ["file1.json"],
                location: "localschema.json",
                foo: "bar",
              },
            ],
          },
        },
      },
      {
        config: {
          customCatalog: {
            schemas: [
              {
                name: "Schema 1",
                fileMatch: ["file1.json"],
                location: "localschema.json",
                url: "https://example.com/remoteschema.json",
              },
            ],
          },
        },
      },
      {
        config: {
          customCatalog: {
            schemas: [
              {
                name: "Schema 1",
                fileMatch: ["file1.json"],
                location: "localschema.json",
                parser: "invalid",
              },
            ],
          },
        },
      },
    ];
    for (const config of invalidConfigs) {
      assert.throws(() => validateConfig(config), {
        name: "Error",
        message: "Malformed config file",
      });
    }
  });
});
