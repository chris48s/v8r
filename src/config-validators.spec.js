import assert from "assert";

import { getDocumentFormats, getOutputFormats } from "./bootstrap.js";
import {
  validateConfigAgainstSchema,
  validateConfigDocumentParsers,
  validateConfigOutputFormats,
} from "./config-validators.js";
import { loadAllPlugins } from "./plugins.js";
import { setUp, tearDown } from "./test-helpers.js";

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

const { allLoadedPlugins } = await loadAllPlugins([]);
const documentFormats = getDocumentFormats(allLoadedPlugins);
const outputFormats = getOutputFormats(allLoadedPlugins);

describe("validateConfigAgainstSchema", function () {
  const messages = {};

  beforeEach(function () {
    setUp(messages);
  });

  afterEach(function () {
    tearDown();
  });

  it("should pass valid configs", function () {
    for (const config of validConfigs) {
      assert(validateConfigAgainstSchema(config));
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
    ];
    for (const config of invalidConfigs) {
      assert.throws(() => validateConfigAgainstSchema(config), {
        name: "Error",
        message: "Malformed config file",
      });
    }
  });
});

describe("validateConfigDocumentParsers", function () {
  it("should pass valid configs", function () {
    for (const config of validConfigs) {
      assert(validateConfigDocumentParsers(config, documentFormats));
    }
  });

  it("should reject invalid configs", function () {
    const invalidConfigs = [
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
      assert.throws(
        () => validateConfigDocumentParsers(config, documentFormats),
        {
          name: "Error",
          message: /^Malformed config file.*$/,
        },
      );
    }
  });
});

describe("validateConfigOutputFormats", function () {
  it("should pass valid configs", function () {
    for (const config of validConfigs) {
      assert(validateConfigOutputFormats(config, outputFormats));
    }
  });

  it("should reject invalid configs", function () {
    const invalidConfigs = [{ config: { format: "invalid" } }];
    for (const config of invalidConfigs) {
      assert.throws(() => validateConfigOutputFormats(config, outputFormats), {
        name: "Error",
        message: /^Malformed config file.*$/,
      });
    }
  });
});
