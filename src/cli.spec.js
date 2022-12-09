import { randomUUID } from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { mockCwd } from "mock-cwd";
import nock from "nock";
import { cli } from "./cli.js";
import logger from "./logger.js";
import {
  chai,
  setUp,
  tearDown,
  logContainsSuccess,
  logContainsInfo,
  logContainsError,
} from "./test-helpers.js";

const assert = chai.assert;
const expect = chai.expect;

describe("CLI", function () {
  // Mock the catalog validation schema
  beforeEach(() => {
    nock.disableNetConnect();
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
      });
  });

  describe("success behaviour, single file", function () {
    const schema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: { num: { type: "number" } },
    };

    beforeEach(() => setUp());
    afterEach(() => {
      tearDown();
      nock.cleanAll();
    });

    it("should return 0 when file is valid (with user-supplied local schema)", function () {
      return cli({
        patterns: ["./testfiles/files/valid.json"],
        schema: "./testfiles/schemas/schema.json",
      }).then((result) => {
        assert.equal(result, 0);
        assert(logContainsSuccess("./testfiles/files/valid.json is valid"));
      });
    });

    it("should return 99 when file is invalid (with user-supplied local schema)", function () {
      return cli({
        patterns: ["./testfiles/files/invalid.json"],
        schema: "./testfiles/schemas/schema.json",
      }).then((result) => {
        assert.equal(result, 99);
        assert(logContainsError("./testfiles/files/invalid.json is invalid"));
      });
    });

    it("should return 0 when file is valid (with user-supplied remote schema)", function () {
      const mock = nock("https://example.com")
        .get("/schema.json")
        .reply(200, schema);

      return cli({
        patterns: ["./testfiles/files/valid.json"],
        schema: "https://example.com/schema.json",
      }).then((result) => {
        assert.equal(result, 0);
        assert(logContainsSuccess("./testfiles/files/valid.json is valid"));
        mock.done();
      });
    });

    it("should return 99 when file is invalid (with user-supplied remote schema)", function () {
      const mock = nock("https://example.com")
        .get("/schema.json")
        .reply(200, schema);

      return cli({
        patterns: ["./testfiles/files/invalid.json"],
        schema: "https://example.com/schema.json",
      }).then((result) => {
        assert.equal(result, 99);
        assert(logContainsError("./testfiles/files/invalid.json is invalid"));
        mock.done();
      });
    });

    it("should return 0 when file is valid (with auto-detected schema)", function () {
      const catalogMock = nock("https://www.schemastore.org")
        .get("/api/json/catalog.json")
        .reply(200, {
          schemas: [
            {
              url: "https://example.com/schema.json",
              fileMatch: ["valid.json", "invalid.json"],
            },
          ],
        });
      const schemaMock = nock("https://example.com")
        .get("/schema.json")
        .reply(200, schema);

      return cli({ patterns: ["./testfiles/files/valid.json"] }).then(
        (result) => {
          assert.equal(result, 0);
          assert(logContainsSuccess("./testfiles/files/valid.json is valid"));
          catalogMock.done();
          schemaMock.done();
        }
      );
    });

    it("should return 99 when file is invalid (with auto-detected schema)", function () {
      const catalogMock = nock("https://www.schemastore.org")
        .get("/api/json/catalog.json")
        .reply(200, {
          schemas: [
            {
              url: "https://example.com/schema.json",
              fileMatch: ["valid.json", "invalid.json"],
            },
          ],
        });
      const schemaMock = nock("https://example.com")
        .get("/schema.json")
        .reply(200, schema);

      return cli({ patterns: ["./testfiles/files/invalid.json"] }).then(
        (result) => {
          assert.equal(result, 99);
          assert(logContainsError("./testfiles/files/invalid.json is invalid"));
          catalogMock.done();
          schemaMock.done();
        }
      );
    });

    it("should use schema from custom local catalog if match found", function () {
      const catalogMock = nock("https://www.schemastore.org")
        .get("/api/json/catalog.json")
        .reply(200, {
          schemas: [
            {
              url: "https://example.com/not-used-schema.json",
              fileMatch: ["valid.json", "invalid.json"],
            },
          ],
        });
      const schemaMock = nock("https://example.com")
        .get("/schema.json")
        .reply(200, schema);

      return cli({
        patterns: ["./testfiles/files/valid.json"],
        catalogs: ["./testfiles/catalogs/catalog-url.json"],
      }).then((result) => {
        assert.equal(result, 0, logger.stderr);
        assert(
          logContainsInfo(
            "Found schema in ./testfiles/catalogs/catalog-url.json ..."
          )
        );
        assert(logContainsSuccess("./testfiles/files/valid.json is valid"));
        expect(catalogMock.isDone()).to.be.false;
        schemaMock.done();
      });
    });

    it("should use schema from custom remote catalog if match found", function () {
      const storeCatalogMock = nock("https://www.schemastore.org")
        .get("/api/json/catalog.json")
        .reply(200, {
          schemas: [
            {
              url: "https://example.com/not-used-schema.json",
              fileMatch: ["valid.json", "invalid.json"],
            },
          ],
        });
      const customCatalogMock = nock("https://my-catalog.com")
        .get("/catalog.json")
        .reply(200, {
          schemas: [
            {
              url: "https://example.com/schema.json",
              fileMatch: ["valid.json", "invalid.json"],
            },
          ],
        });
      const customSchemaMock = nock("https://example.com")
        .get("/schema.json")
        .reply(200, schema);

      return cli({
        patterns: ["./testfiles/files/valid.json"],
        catalogs: ["https://my-catalog.com/catalog.json"],
      }).then((result) => {
        assert.equal(result, 0);
        assert(
          logContainsInfo(
            "Found schema in https://my-catalog.com/catalog.json ..."
          )
        );
        assert(logContainsSuccess("./testfiles/files/valid.json is valid"));
        expect(storeCatalogMock.isDone()).to.be.false;
        customCatalogMock.done();
        customSchemaMock.done();
      });
    });

    it("should fall back to next custom catalog if match not found in first", function () {
      const mock = nock("https://example.com")
        .get("/schema.json")
        .reply(200, schema);

      return cli({
        patterns: ["./testfiles/files/valid.json"],
        catalogs: [
          "./testfiles/catalogs/catalog-nomatch.json",
          "./testfiles/catalogs/catalog-url.json",
        ],
      }).then((result) => {
        assert.equal(result, 0, logger.stderr);
        assert(
          logContainsInfo(
            "Found schema in ./testfiles/catalogs/catalog-url.json ..."
          )
        );
        assert(logContainsSuccess("./testfiles/files/valid.json is valid"));
        mock.done();
      });
    });

    it("should fall back to schemastore.org if match not found in custom catalogs", function () {
      const storeCatalogMock = nock("https://www.schemastore.org")
        .get("/api/json/catalog.json")
        .reply(200, {
          schemas: [
            {
              url: "https://example.com/schema.json",
              fileMatch: ["valid.json", "invalid.json"],
            },
          ],
        });
      const storeSchemaMock = nock("https://example.com")
        .get("/schema.json")
        .reply(200, schema);

      return cli({
        patterns: ["./testfiles/files/valid.json"],
        catalogs: ["./testfiles/catalogs/catalog-nomatch.json"],
      }).then((result) => {
        assert.equal(result, 0, logger.stderr);
        assert(
          logContainsInfo(
            "Found schema in https://www.schemastore.org/api/json/catalog.json ..."
          )
        );
        assert(logContainsSuccess("./testfiles/files/valid.json is valid"));
        storeCatalogMock.done();
        storeSchemaMock.done();
      });
    });

    it("should use schema from config file if match found", function () {
      return cli({
        patterns: ["./testfiles/files/valid.json"],
        catalogs: ["./testfiles/catalogs/catalog-url.json"],
        customCatalog: {
          schemas: [
            {
              name: "custom schema",
              fileMatch: ["valid.json", "valid.yml"],
              location: "./testfiles/schemas/schema.json",
            },
          ],
        },
        configFileRelativePath: "foobar.conf",
      }).then((result) => {
        assert.equal(result, 0, logger.stderr);
        assert(logContainsInfo("Found schema in foobar.conf ..."));
        assert(logContainsSuccess("./testfiles/files/valid.json is valid"));
      });
    });

    it("should fall back to custom catalog if match not found in config file", function () {
      const mock = nock("https://example.com")
        .get("/schema.json")
        .reply(200, schema);

      return cli({
        patterns: ["./testfiles/files/valid.json"],
        catalogs: ["./testfiles/catalogs/catalog-url.json"],
        customCatalog: {
          schemas: [
            {
              name: "custom schema",
              fileMatch: ["does-not-match.json"],
              location: "./testfiles/schemas/schema.json",
            },
          ],
        },
        configFileRelativePath: "foobar.conf",
      }).then((result) => {
        assert.equal(result, 0, logger.stderr);
        assert(
          logContainsInfo(
            "Found schema in ./testfiles/catalogs/catalog-url.json ..."
          )
        );
        assert(logContainsSuccess("./testfiles/files/valid.json is valid"));
        mock.done();
      });
    });

    it("should fall back to schemastore.org if match not found in config file or custom catalogs", function () {
      const storeCatalogMock = nock("https://www.schemastore.org")
        .get("/api/json/catalog.json")
        .reply(200, {
          schemas: [
            {
              url: "https://example.com/schema.json",
              fileMatch: ["valid.json", "invalid.json"],
            },
          ],
        });
      const storeSchemaMock = nock("https://example.com")
        .get("/schema.json")
        .reply(200, schema);

      return cli({
        patterns: ["./testfiles/files/valid.json"],
        catalogs: ["./testfiles/catalogs/catalog-nomatch.json"],
        customCatalog: {
          schemas: [
            {
              name: "custom schema",
              fileMatch: ["does-not-match.json"],
              location: "./testfiles/schemas/schema.json",
            },
          ],
        },
        configFileRelativePath: "foobar.conf",
      }).then((result) => {
        assert.equal(result, 0, logger.stderr);
        assert(
          logContainsInfo(
            "Found schema in https://www.schemastore.org/api/json/catalog.json ..."
          )
        );
        assert(logContainsSuccess("./testfiles/files/valid.json is valid"));
        storeCatalogMock.done();
        storeSchemaMock.done();
      });
    });

    it("should find a schema using glob patterns", function () {
      const catalogMock = nock("https://www.schemastore.org")
        .get("/api/json/catalog.json")
        .reply(200, {
          schemas: [
            {
              url: "https://example.com/schema.json",
              fileMatch: ["testfiles/files/*.json"],
            },
          ],
        });
      const schemaMock = nock("https://example.com")
        .get("/schema.json")
        .reply(200, schema);

      return cli({ patterns: ["./testfiles/files/valid.json"] }).then(
        (result) => {
          assert.equal(result, 0);
          catalogMock.done();
          schemaMock.done();
        }
      );
    });

    it("should validate yaml files", function () {
      return cli({
        patterns: ["./testfiles/files/valid.yaml"],
        schema: "./testfiles/schemas/schema.json",
      }).then((result) => {
        assert.equal(result, 0);
        assert(logContainsSuccess("./testfiles/files/valid.yaml is valid"));
      });
    });

    it("should validate json5 files", function () {
      return cli({
        patterns: ["./testfiles/files/valid.json5"],
        schema: "./testfiles/schemas/schema.json",
      }).then((result) => {
        assert.equal(result, 0);
        assert(logContainsSuccess("./testfiles/files/valid.json5 is valid"));
      });
    });

    it("should use custom parser in preference to file extension if specified", function () {
      return cli({
        patterns: ["./testfiles/files/with-comments.json"],
        customCatalog: {
          schemas: [
            {
              name: "custom schema",
              fileMatch: ["with-comments.json"],
              location: "./testfiles/schemas/schema.json",
              parser: "json5",
            },
          ],
        },
        configFileRelativePath: "foobar.conf",
      }).then((result) => {
        assert.equal(result, 0);
        assert(
          logContainsSuccess("./testfiles/files/with-comments.json is valid")
        );
      });
    });
  });

  describe("error handling, single file", function () {
    beforeEach(() => setUp());
    afterEach(() => tearDown());

    it("should return 1 if invalid response from schemastore", async function () {
      const mock = nock("https://www.schemastore.org")
        .get("/api/json/catalog.json")
        .reply(404, {});

      return cli({ patterns: ["./testfiles/files/valid.json"] }).then(
        (result) => {
          assert.equal(result, 1);
          assert(
            logContainsError(
              "Failed fetching https://www.schemastore.org/api/json/catalog.json"
            )
          );
          mock.done();
        }
      );
    });

    it("should return 1 if invalid response fetching auto-detected schema", async function () {
      const catalogMock = nock("https://www.schemastore.org")
        .get("/api/json/catalog.json")
        .reply(200, {
          schemas: [
            {
              url: "https://example.com/schema.json",
              fileMatch: ["valid.json", "invalid.json"],
            },
          ],
        });
      const schemaMock = nock("https://example.com")
        .get("/schema.json")
        .reply(404, {});

      return cli({ patterns: ["./testfiles/files/valid.json"] }).then(
        (result) => {
          assert.equal(result, 1);
          assert(
            logContainsError("Failed fetching https://example.com/schema.json")
          );
          catalogMock.done();
          schemaMock.done();
        }
      );
    });

    it("should return 1 if we can't find a schema", async function () {
      const mock = nock("https://www.schemastore.org")
        .get("/api/json/catalog.json")
        .reply(200, {
          schemas: [
            {
              url: "https://example.com/schema.json",
              fileMatch: ["not-a-match.json"],
            },
          ],
        });

      return cli({ patterns: ["./testfiles/files/valid.json"] }).then(
        (result) => {
          assert.equal(result, 1);
          assert(
            logContainsError(
              "Could not find a schema to validate ./testfiles/files/valid.json"
            )
          );
          mock.done();
        }
      );
    });

    it("should return 1 if multiple schemas are matched", async function () {
      const mock = nock("https://www.schemastore.org")
        .get("/api/json/catalog.json")
        .reply(200, {
          schemas: [
            {
              url: "https://example.com/schema1.json",
              name: "example schema 1",
              fileMatch: ["valid.json"],
            },
            {
              url: "https://example.com/schema2.json",
              name: "example schema 2",
              fileMatch: ["testfiles/files/valid*"],
            },
          ],
        });

      return cli({ patterns: ["./testfiles/files/valid.json"] }).then(
        (result) => {
          assert.equal(result, 1);
          assert(
            logContainsError(
              "Could not find a schema to validate ./testfiles/files/valid.json"
            )
          );
          assert(
            logContainsInfo(
              "Found multiple possible schemas for ./testfiles/files/valid.json. Possible matches:"
            )
          );
          assert(
            logContainsInfo(
              "example schema 1\n  https://example.com/schema1.json"
            )
          );
          assert(
            logContainsInfo(
              "example schema 2\n  https://example.com/schema2.json"
            )
          );
          mock.done();
        }
      );
    });

    it("should return 1 if invalid response fetching user-supplied schema", async function () {
      const mock = nock("https://example.com")
        .get("/schema.json")
        .reply(404, {});

      return cli({
        patterns: ["./testfiles/files/valid.json"],
        schema: "https://example.com/schema.json",
      }).then((result) => {
        assert.equal(result, 1);
        assert(
          logContainsError("Failed fetching https://example.com/schema.json")
        );
        mock.done();
      });
    });

    it("should return 97 if config file is found but invalid", async function () {
      const tempDir = path.join(os.tmpdir(), randomUUID());
      const tempFile = path.join(tempDir, ".v8rrc");
      fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(tempFile, '{"foo":"bar"}');

      const mock = mockCwd(tempDir);
      return cli().then((result) => {
        mock.restore();
        fs.rmSync(tempDir, { recursive: true, force: true });
        assert.equal(result, 97);
        assert(logContainsError("Malformed config file"));
      });
    });

    it("should return 98 if any glob pattern matches no files", async function () {
      return cli({
        patterns: [
          "./testfiles/files/valid.json",
          "./testfiles/does-not-exist.json",
        ],
      }).then((result) => {
        assert.equal(result, 98);
        assert(
          logContainsError(
            "Pattern './testfiles/does-not-exist.json' did not match any files"
          )
        );
      });
    });

    it("should return 98 if glob pattern is invalid", async function () {
      return cli({ patterns: [""] }).then((result) => {
        assert.equal(result, 98);
        assert(logContainsError("Pattern '' did not match any files"));
      });
    });

    it("should return 1 if target file type is not supported", async function () {
      return cli({
        patterns: ["./testfiles/files/not-supported.txt"],
        schema: "./testfiles/schemas/schema.json",
      }).then((result) => {
        assert.equal(result, 1);
        assert(logContainsError("Unsupported format .txt"));
      });
    });

    it("should return 1 if local schema file not found", async function () {
      return cli({
        patterns: ["./testfiles/files/valid.json"],
        schema: "./testfiles/does-not-exist.json",
      }).then((result) => {
        assert.equal(result, 1);
        assert(
          logContainsError(
            "ENOENT: no such file or directory, open './testfiles/does-not-exist.json'"
          )
        );
      });
    });

    it("should return 1 if local catalog file not found", async function () {
      return cli({
        patterns: ["./testfiles/files/valid.json"],
        catalogs: ["./testfiles/does-not-exist.json"],
      }).then((result) => {
        assert.equal(result, 1);
        assert(
          logContainsError(
            "ENOENT: no such file or directory, open './testfiles/does-not-exist.json'"
          )
        );
      });
    });

    it("should return 1 if invalid response fetching remote catalog", async function () {
      const mock = nock("https://example.com")
        .get("/catalog.json")
        .reply(404, {});

      return cli({
        patterns: ["./testfiles/files/valid.json"],
        catalogs: ["https://example.com/catalog.json"],
      }).then((result) => {
        assert.equal(result, 1);
        assert(
          logContainsError("Failed fetching https://example.com/catalog.json")
        );
        mock.done();
      });
    });

    it("should return 1 on malformed catalog (missing 'schemas')", async function () {
      const mock = nock("https://example.com")
        .get("/catalog.json")
        .reply(200, {});

      return cli({
        patterns: ["./testfiles/files/valid.json"],
        catalogs: ["https://example.com/catalog.json"],
      }).then((result) => {
        assert.equal(result, 1);
        mock.done();
        assert(
          logContainsError(
            "Malformed catalog at https://example.com/catalog.json"
          )
        );
      });
    });

    it("should return 1 on malformed catalog ('schemas' should be an array)", async function () {
      const mock = nock("https://example.com")
        .get("/catalog.json")
        .reply(200, { schemas: {} });

      return cli({
        patterns: ["./testfiles/files/valid.json"],
        catalogs: ["https://example.com/catalog.json"],
      }).then((result) => {
        assert.equal(result, 1);
        mock.done();
        assert(
          logContainsError(
            "Malformed catalog at https://example.com/catalog.json"
          )
        );
      });
    });

    it("should return 1 on malformed catalog ('schemas' elements should contains a valid url)", async function () {
      return cli({
        patterns: ["./testfiles/files/valid.json"],
        catalogs: ["./testfiles/catalogs/catalog-malformed.json"],
      }).then((result) => {
        assert.equal(result, 1);
        assert(
          logContainsError(
            "Malformed catalog at ./testfiles/catalogs/catalog-malformed.json"
          )
        );
      });
    });

    it("should return 0 if ignore-errors flag is passed", async function () {
      return cli({
        patterns: ["./testfiles/files/not-supported.txt"],
        schema: "./testfiles/schemas/schema.json",
        ignoreErrors: true,
      }).then((result) => {
        assert.equal(result, 0);
        assert(logContainsError("Unsupported format .txt"));
      });
    });
  });

  describe("multiple file processing", function () {
    beforeEach(() => setUp());
    afterEach(() => tearDown());

    it("should return 0 if all files are valid", async function () {
      return cli({
        patterns: [
          "{./testfiles/files/valid.json,./testfiles/files/valid.yaml}",
        ],
        schema: "./testfiles/schemas/schema.json",
      }).then((result) => {
        assert.equal(result, 0);
        assert(logContainsSuccess("is valid", 2));
      });
    });

    it("should accept multiple glob patterns", async function () {
      return cli({
        patterns: [
          "./testfiles/files/valid.json",
          "./testfiles/files/valid.yaml",
        ],
        schema: "./testfiles/schemas/schema.json",
      }).then((result) => {
        assert.equal(result, 0);
        assert(logContainsSuccess("is valid", 2));
      });
    });

    it("should return 99 if any file is invalid", async function () {
      return cli({
        patterns: [
          "{./testfiles/files/valid.json,./testfiles/files/invalid.json,./testfiles/files/not-supported.txt}",
        ],
        schema: "./testfiles/schemas/schema.json",
      }).then((result) => {
        assert.equal(result, 99);
        assert(logContainsSuccess("./testfiles/files/valid.json is valid"));
        assert(logContainsError("./testfiles/files/invalid.json is invalid"));
        assert(logContainsError("Unsupported format .txt"));
      });
    });

    it("should return 1 if any file throws an error and no files are invalid", async function () {
      return cli({
        patterns: [
          "{./testfiles/files/valid.json,./testfiles/files/not-supported.txt}",
        ],
        schema: "./testfiles/schemas/schema.json",
      }).then((result) => {
        assert.equal(result, 1);
        assert(logContainsSuccess("./testfiles/files/valid.json is valid"));
        assert(logContainsError("Unsupported format .txt"));
      });
    });

    it("should ignore errors when ignore-errors flag is passed", async function () {
      return cli({
        patterns: [
          "{./testfiles/files/valid.json,./testfiles/files/not-supported.txt}",
        ],
        schema: "./testfiles/schemas/schema.json",
        ignoreErrors: true,
      }).then((result) => {
        assert.equal(result, 0);
        assert(logContainsSuccess("./testfiles/files/valid.json is valid"));
        assert(logContainsError("Unsupported format .txt"));
      });
    });
  });

  describe("output formats", function () {
    beforeEach(() => setUp());
    afterEach(() => tearDown());

    it("should log errors in text format when format is text", async function () {
      return cli({
        patterns: [
          "{./testfiles/files/valid.json,./testfiles/files/invalid.json,./testfiles/files/not-supported.txt}",
        ],
        schema: "./testfiles/schemas/schema.json",
        format: "text",
      }).then(() => {
        assert(
          logger.stdout.includes(
            "./testfiles/files/invalid.json#/num must be number"
          )
        );
      });
    });

    it("should output json report when format is json", async function () {
      return cli({
        patterns: [
          "{./testfiles/files/valid.json,./testfiles/files/invalid.json,./testfiles/files/not-supported.txt}",
        ],
        schema: "./testfiles/schemas/schema.json",
        format: "json",
      }).then(() => {
        const expected = {
          results: {
            "./testfiles/files/invalid.json": {
              code: 99,
              errors: [
                {
                  instancePath: "/num",
                  keyword: "type",
                  message: "must be number",
                  params: {
                    type: "number",
                  },
                  schemaPath: "#/properties/num/type",
                },
              ],
              fileLocation: "./testfiles/files/invalid.json",
              schemaLocation: "./testfiles/schemas/schema.json",
              valid: false,
            },
            "./testfiles/files/not-supported.txt": {
              code: 1,
              errors: [],
              fileLocation: "./testfiles/files/not-supported.txt",
              schemaLocation: "./testfiles/schemas/schema.json",
              valid: null,
            },
            "./testfiles/files/valid.json": {
              code: 0,
              errors: [],
              fileLocation: "./testfiles/files/valid.json",
              schemaLocation: "./testfiles/schemas/schema.json",
              valid: true,
            },
          },
        };
        expect(JSON.parse(logger.stdout[0])).to.deep.equal(expected);
      });
    });
  });

  describe("external reference resolver", function () {
    beforeEach(() => setUp());
    afterEach(() => {
      tearDown();
      nock.cleanAll();
    });

    it("resolves remote $refs", function () {
      const fragment = {
        type: "object",
        properties: {
          num: {
            type: "number",
          },
        },
        required: ["num"],
      };
      const refMock = nock("https://example.com/foobar")
        .get("/fragment.json")
        .reply(200, fragment);

      return cli({
        patterns: ["./testfiles/files/valid.json"],
        schema: "./testfiles/schemas/remote_external_ref.json",
      }).then((result) => {
        assert.equal(result, 0);
        assert(logContainsSuccess("./testfiles/files/valid.json is valid"));
        refMock.done();
      });
    });

    it("resolves local $refs (with $id)", async function () {
      return cli({
        patterns: ["./testfiles/files/valid.json"],
        schema: "./testfiles/schemas/local_external_ref_with_id.json",
      }).then((result) => {
        assert.equal(result, 0);
        assert(logContainsSuccess("./testfiles/files/valid.json is valid"));
      });
    });

    it("resolves local $refs (without $id)", async function () {
      return cli({
        patterns: ["./testfiles/files/valid.json"],
        schema: "./testfiles/schemas/local_external_ref_without_id.json",
      }).then((result) => {
        assert.equal(result, 0);
        assert(logContainsSuccess("./testfiles/files/valid.json is valid"));
      });
    });

    it("fails on invalid $ref", async function () {
      return cli({
        patterns: ["./testfiles/files/valid.json"],
        schema: "./testfiles/schemas/invalid_external_ref.json",
      }).then((result) => {
        assert.equal(result, 1);
        assert(
          logContainsError(
            "no such file or directory, open 'testfiles/schemas/does-not-exist.json'"
          )
        );
      });
    });
  });
});
