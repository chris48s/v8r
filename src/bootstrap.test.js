import assert from "node:assert";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  bootstrap,
  getDocumentFormats,
  getOutputFormats,
  parseArgs,
} from "./bootstrap.js";
import { loadAllPlugins } from "./plugin-loader.js";
import { setUp, tearDown, logContainsInfo } from "./testhelpers.js";

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
    assert.equal(args.outputFormat, "text");
    assert.equal(args.verbose, 0);
    assert.equal(args.catalogs, undefined);
    assert.equal(args.schema, undefined);
    assert.deepStrictEqual(args.ignorePatternFiles, [
      ".v8rignore",
      ".gitignore",
    ]);
    assert.equal(args.ignore, true);
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
          ignorePatternFiles: [".v8rignore"],
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
    assert.deepStrictEqual(args.ignorePatternFiles, [".v8rignore"]);
    assert.equal(args.ignore, true);
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
        "--ignore-pattern-files",
        ".gitignore",
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
    assert.deepStrictEqual(args.ignorePatternFiles, [".gitignore"]);
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
        "--ignore-pattern-files",
        ".gitignore",
      ],
      {
        config: {
          patterns: ["file1.json", "file2.json"],
          ignoreErrors: false,
          cacheTtl: 300,
          verbose: 1,
          ignorePatternFiles: [".v8rignore"],
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
    assert.deepStrictEqual(args.ignorePatternFiles, [".gitignore"]);
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

  it("should accept multiple ignore files", function () {
    const args = parseArgs(
      [
        "node",
        "index.js",
        "infile.json",
        "--ignore-pattern-files",
        "ignore1",
        "ignore2",
      ],
      { config: {} },
      documentFormats,
      outputFormats,
    );
    assert.deepStrictEqual(args.ignorePatternFiles, ["ignore1", "ignore2"]);
  });

  it("should accept no-ignore param", function () {
    const args = parseArgs(
      ["node", "index.js", "infile.json", "--no-ignore"],
      { config: {} },
      documentFormats,
      outputFormats,
    );
    assert.deepStrictEqual(args.ignore, false);
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
      { cache: false },
    );
    assert.equal(config.ignoreErrors, false);
    assert.deepStrictEqual(config.ignorePatternFiles, [
      ".v8rignore",
      ".gitignore",
    ]);
    assert.equal(config.cacheTtl, 600);
    assert.equal(config.verbose, 0);
    assert.equal(config.catalogs, undefined);
    assert.equal(config.schema, undefined);
    assert.equal(config.cacheName, undefined);
    assert.equal(config.customCatalog, undefined);
    assert.equal(config.configFileRelativePath, undefined);
    assert(logContainsInfo("No config file found"));
  });

  it("should throw if V8R_CONFIG_FILE does not exist", async function () {
    process.env.V8R_CONFIG_FILE = "./testfiles/does-not-exist.json";
    await assert.rejects(
      bootstrap(["node", "index.js", "infile.json"], undefined, {
        cache: false,
      }),
      {
        name: "Error",
        message: "File ./testfiles/does-not-exist.json does not exist.",
      },
    );
  });

  it("should read options from config file if available", async function () {
    process.env.V8R_CONFIG_FILE = "./testfiles/configs/config.json";
    const { config } = await bootstrap(["node", "index.js"], undefined, {
      cache: false,
    });
    assert.equal(config.ignoreErrors, true);
    assert.deepStrictEqual(config.ignorePatternFiles, [".v8rignore"]);
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
          location: "./testfiles/schemas/schema.json",
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
    process.env.V8R_CONFIG_FILE = "./testfiles/configs/config.json";
    const { config } = await bootstrap(
      [
        "node",
        "index.js",
        "infile.json",
        "--ignore-errors",
        "--cache-ttl",
        "86400",
        "-vv",
        "--ignore-pattern-files",
        ".gitignore",
      ],
      undefined,
      { cache: false },
    );
    assert.deepStrictEqual(config.patterns, ["infile.json"]);
    assert.equal(config.ignoreErrors, true);
    assert.deepStrictEqual(config.ignorePatternFiles, [".gitignore"]);
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
          location: "./testfiles/schemas/schema.json",
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
