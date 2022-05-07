import path from "path";
import {
  getConfig,
  parseArgs,
  preProcessConfig,
  validateConfig,
} from "./config.js";
import { chai, setUp, tearDown, containsInfo } from "./test-helpers.js";

const assert = chai.assert;
const expect = chai.expect;

describe("parseArgs", function () {
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

describe("preProcessConfig", function () {
  it("passes through absolute paths", function () {
    const configFile = {
      config: {
        customCatalog: { schemas: [{ location: "/foo/bar/schema.json" }] },
      },
      filepath: "/home/fred/.v8rrc",
    };
    preProcessConfig(configFile);
    expect(configFile.config.customCatalog.schemas[0].location).to.equal(
      "/foo/bar/schema.json"
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
    expect(configFile.config.customCatalog.schemas[0].location).to.equal(
      "https://example.com/schema.json"
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
      expect(configFile.config.customCatalog.schemas[0].location).to.equal(
        testCase[1]
      );
    }
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
          location: path.resolve("./testfiles/schemas/schema.json"),
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
          location: path.resolve("./testfiles/schemas/schema.json"),
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

describe("validateConfig", function () {
  const messages = {};

  beforeEach(() => setUp(messages));
  afterEach(() => {
    tearDown();
  });

  it("should pass valid configs", function () {
    const validConfigs = [
      {},
      {
        ignoreErrors: true,
        verbose: 0,
        patterns: ["foobar.js"],
        cacheTtl: 600,
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
    ];
    for (const config of validConfigs) {
      expect(validateConfig(config)).to.be.true;
    }
  });

  it("should reject invalid configs", function () {
    const invalidConfigs = [
      { ignoreErrors: "string" },
      { foo: "bar" },
      { verbose: "string" },
      { verbose: -1 },
      { patterns: "string" },
      { patterns: [] },
      { patterns: ["valid", "ok", false] },
      { patterns: ["duplicate", "duplicate"] },
      { cacheTtl: "string" },
      { cacheTtl: -1 },
      { customCatalog: "string" },
      { customCatalog: {} },
      { customCatalog: { schemas: [{}] } },
      {
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
      {
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
      {
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
    ];
    for (const config of invalidConfigs) {
      expect(() => validateConfig(config)).to.throw(
        Error,
        "Malformed config file"
      );
    }
  });
});
