import chai from "chai";
import { getConfig, parseArgs } from "./config.js";
import { setUp, tearDown, containsInfo } from "./test-helpers.js";

const assert = chai.assert;
const expect = chai.expect;

describe("Argument parser", function () {
  it("should populate default values when no args and no base config", function () {
    const args = parseArgs(["node", "index.js", "infile.json"], { config: {} });
    expect(args).to.have.property("ignoreErrors", false);
    expect(args).to.have.property("cacheTtl", 600);
    expect(args).to.have.property("verbose", 0);
    expect(args).to.not.have.property("catalogs");
    expect(args).to.not.have.property("schema");
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
    expect(args).to.have.deep.property("patterns", [
      "file1.json",
      "file2.json",
    ]);
    expect(args).to.have.property("ignoreErrors", true);
    expect(args).to.have.property("cacheTtl", 300);
    expect(args).to.have.property("verbose", 1);
    expect(args).to.not.have.property("catalogs");
    expect(args).to.not.have.property("schema");
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
      { config: {} }
    );
    expect(args).to.have.deep.property("patterns", ["infile.json"]);
    expect(args).to.have.property("ignoreErrors", true);
    expect(args).to.have.property("cacheTtl", 86400);
    expect(args).to.have.property("verbose", 2);
    expect(args).to.not.have.property("catalogs");
    expect(args).to.not.have.property("schema");
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
      }
    );
    expect(args).to.have.deep.property("patterns", ["infile.json"]);
    expect(args).to.have.property("ignoreErrors", true);
    expect(args).to.have.property("cacheTtl", 86400);
    expect(args).to.have.property("verbose", 2);
    expect(args).to.not.have.property("catalogs");
    expect(args).to.not.have.property("schema");
  });

  it("should accept schema param", function () {
    const args = parseArgs(
      ["node", "index.js", "infile.json", "--schema", "http://foo.bar/baz"],
      { config: {} }
    );
    expect(args).to.have.property("schema", "http://foo.bar/baz");
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
      { config: {} }
    );
    expect(args).to.have.property("catalogs");
    expect(args.catalogs).to.be.an("Array");
    expect(args.catalogs).to.have.lengthOf(2);
  });

  it("should accept multiple patterns", function () {
    const args = parseArgs(
      ["node", "index.js", "file1.json", "dir/*", "file2.json", "*.yaml"],
      { config: {} }
    );
    expect(args).to.have.deep.property("patterns", [
      "file1.json",
      "dir/*",
      "file2.json",
      "*.yaml",
    ]);
  });
});

describe("getConfig", function () {
  const messages = {};

  beforeEach(() => setUp(messages));
  afterEach(() => {
    tearDown();
  });

  it("should use defaults if no config file found", async function () {
    const config = await getConfig(["node", "index.js", "infile.json"], {
      searchPlaces: ["./testfiles/does-not-exist.json"],
      cache: false,
    });
    expect(config).to.have.property("ignoreErrors", false);
    expect(config).to.have.property("cacheTtl", 600);
    expect(config).to.have.property("verbose", 0);
    expect(config).to.not.have.property("catalogs");
    expect(config).to.not.have.property("schema");
    expect(config).to.have.property("cacheName", undefined);
    expect(config).to.have.property("customCatalog", undefined);
    expect(config).to.have.property("configFileRelativePath", undefined);
    assert(containsInfo(messages, "No config file found"));
  });

  it("should read options from config file if available", async function () {
    const config = await getConfig(["node", "index.js"], {
      searchPlaces: ["./testfiles/configs/config.json"],
      cache: false,
    });
    expect(config).to.have.property("ignoreErrors", true);
    expect(config).to.have.property("cacheTtl", 300);
    expect(config).to.have.property("verbose", 1);
    expect(config).to.have.deep.property("patterns", ["./foobar/*.json"]);
    expect(config).to.not.have.property("catalogs");
    expect(config).to.not.have.property("schema");
    expect(config).to.have.property("cacheName", undefined);
    expect(config).to.have.deep.property("customCatalog", {
      schemas: [
        {
          name: "custom schema",
          fileMatch: ["valid.json", "invalid.json"],
          location: "./testfiles/schemas/schema.json",
          parser: "json5",
        },
      ],
    });
    expect(config).to.have.property(
      "configFileRelativePath",
      "testfiles/configs/config.json"
    );
    assert(
      containsInfo(
        messages,
        "Loaded config file from testfiles/configs/config.json"
      )
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
      }
    );
    expect(config).to.have.deep.property("patterns", ["infile.json"]);
    expect(config).to.have.property("ignoreErrors", true);
    expect(config).to.have.property("cacheTtl", 86400);
    expect(config).to.have.property("verbose", 2);
    expect(config).to.not.have.property("catalogs");
    expect(config).to.not.have.property("schema");
    expect(config).to.have.property("cacheName", undefined);
    expect(config).to.have.deep.property("customCatalog", {
      schemas: [
        {
          name: "custom schema",
          fileMatch: ["valid.json", "invalid.json"],
          location: "./testfiles/schemas/schema.json",
          parser: "json5",
        },
      ],
    });
    expect(config).to.have.property(
      "configFileRelativePath",
      "testfiles/configs/config.json"
    );
    assert(
      containsInfo(
        messages,
        "Loaded config file from testfiles/configs/config.json"
      )
    );
  });
});
