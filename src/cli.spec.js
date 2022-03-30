import chai from "chai";
import nock from "nock";
import { cli } from "./cli.js";
import {
  setUp,
  tearDown,
  containsSuccess,
  containsInfo,
  containsError,
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
    const messages = {};
    const schema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: { num: { type: "number" } },
    };

    beforeEach(() => setUp(messages));
    afterEach(() => {
      tearDown();
      nock.cleanAll();
    });

    it("should return 0 when file is valid (user-supplied local schema)", function () {
      return cli({
        patterns: ["./testfiles/valid.json"],
        schema: "./testfiles/schema.json",
      }).then((result) => {
        assert.equal(result, 0);
        assert(containsSuccess(messages, "./testfiles/valid.json is valid"));
      });
    });

    it("should return 99 when file is invalid (user-supplied local schema)", function () {
      return cli({
        patterns: ["./testfiles/invalid.json"],
        schema: "./testfiles/schema.json",
      }).then((result) => {
        assert.equal(result, 99);
        assert(containsError(messages, "./testfiles/invalid.json is invalid"));
      });
    });

    it("should return 0 when file is valid (with user-supplied remote schema)", function () {
      const mock = nock("https://example.com")
        .get("/schema.json")
        .reply(200, schema);

      return cli({
        patterns: ["./testfiles/valid.json"],
        schema: "https://example.com/schema.json",
      }).then((result) => {
        assert.equal(result, 0);
        assert(containsSuccess(messages, "./testfiles/valid.json is valid"));
        mock.done();
      });
    });

    it("should return 99 when file is invalid (with user-supplied remote schema)", function () {
      const mock = nock("https://example.com")
        .get("/schema.json")
        .reply(200, schema);

      return cli({
        patterns: ["./testfiles/invalid.json"],
        schema: "https://example.com/schema.json",
      }).then((result) => {
        assert.equal(result, 99);
        assert(containsError(messages, "./testfiles/invalid.json is invalid"));
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

      return cli({ patterns: ["./testfiles/valid.json"] }).then((result) => {
        assert.equal(result, 0);
        assert(containsSuccess(messages, "./testfiles/valid.json is valid"));
        catalogMock.done();
        schemaMock.done();
      });
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

      return cli({ patterns: ["./testfiles/invalid.json"] }).then((result) => {
        assert.equal(result, 99);
        assert(containsError(messages, "./testfiles/invalid.json is invalid"));
        catalogMock.done();
        schemaMock.done();
      });
    });

    it("should return 0 when file is valid (with auto-detected schema from custom local catalog)", function () {
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
        patterns: ["./testfiles/valid.json"],
        catalogs: ["./testfiles/catalog-url.json"],
      }).then((result) => {
        assert.equal(result, 0, messages.error);
        assert(
          containsInfo(
            messages,
            "Found schema in ./testfiles/catalog-url.json ..."
          )
        );
        assert(containsSuccess(messages, "./testfiles/valid.json is valid"));
        expect(catalogMock.isDone()).to.be.false;
        schemaMock.done();
      });
    });

    it("should return 0 when file is valid (with auto-detected schema from custom remote catalog)", function () {
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
        patterns: ["./testfiles/valid.json"],
        catalogs: ["https://my-catalog.com/catalog.json"],
      }).then((result) => {
        assert.equal(result, 0);
        assert(
          containsInfo(
            messages,
            "Found schema in https://my-catalog.com/catalog.json ..."
          )
        );
        assert(containsSuccess(messages, "./testfiles/valid.json is valid"));
        expect(storeCatalogMock.isDone()).to.be.false;
        customCatalogMock.done();
        customSchemaMock.done();
      });
    });

    it("should return 0 when file is valid (with auto-detected schema from custom catalog falling back to the next catalog)", function () {
      const mock = nock("https://example.com")
        .get("/schema.json")
        .reply(200, schema);

      return cli({
        patterns: ["./testfiles/valid.json"],
        catalogs: [
          "./testfiles/catalog-nomatch.json",
          "./testfiles/catalog-url.json",
        ],
      }).then((result) => {
        assert.equal(result, 0, messages.error);
        assert(
          containsInfo(
            messages,
            "Found schema in ./testfiles/catalog-url.json ..."
          )
        );
        assert(containsSuccess(messages, "./testfiles/valid.json is valid"));
        mock.done();
      });
    });

    it("should return 0 when file is valid (with auto-detected schema from custom catalog falling back to schemastore.org)", function () {
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
        patterns: ["./testfiles/valid.json"],
        catalogs: ["./testfiles/catalog-nomatch.json"],
      }).then((result) => {
        assert.equal(result, 0, messages.error);
        assert(
          containsInfo(
            messages,
            "Found schema in https://www.schemastore.org/api/json/catalog.json ..."
          )
        );
        assert(containsSuccess(messages, "./testfiles/valid.json is valid"));
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
              fileMatch: ["testfiles/*.json"],
            },
          ],
        });
      const schemaMock = nock("https://example.com")
        .get("/schema.json")
        .reply(200, schema);

      return cli({ patterns: ["./testfiles/valid.json"] }).then((result) => {
        assert.equal(result, 0);
        catalogMock.done();
        schemaMock.done();
      });
    });

    it("should validate yaml files", function () {
      return cli({
        patterns: ["./testfiles/valid.yaml"],
        schema: "./testfiles/schema.json",
      }).then((result) => {
        assert.equal(result, 0);
        assert(containsSuccess(messages, "./testfiles/valid.yaml is valid"));
      });
    });

    it("should validate json5 files", function () {
      return cli({
        patterns: ["./testfiles/valid.json5"],
        schema: "./testfiles/schema.json",
      }).then((result) => {
        assert.equal(result, 0);
        assert(containsSuccess(messages, "./testfiles/valid.json5 is valid"));
      });
    });
  });

  describe("error handling, single file", function () {
    const messages = {};
    beforeEach(() => setUp(messages));
    afterEach(() => tearDown());

    it("should return 1 if invalid response from schemastore", async function () {
      const mock = nock("https://www.schemastore.org")
        .get("/api/json/catalog.json")
        .reply(404, {});

      return cli({ patterns: ["./testfiles/valid.json"] }).then((result) => {
        assert.equal(result, 1);
        assert(
          containsError(
            messages,
            "Failed fetching https://www.schemastore.org/api/json/catalog.json"
          )
        );
        mock.done();
      });
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

      return cli({ patterns: ["./testfiles/valid.json"] }).then((result) => {
        assert.equal(result, 1);
        assert(
          containsError(
            messages,
            "Failed fetching https://example.com/schema.json"
          )
        );
        catalogMock.done();
        schemaMock.done();
      });
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

      return cli({ patterns: ["./testfiles/valid.json"] }).then((result) => {
        assert.equal(result, 1);
        assert(
          containsError(
            messages,
            "Could not find a schema to validate ./testfiles/valid.json"
          )
        );
        mock.done();
      });
    });

    it("should return 1 if multiple schemas are matched", async function () {
      const mock = nock("https://www.schemastore.org")
        .get("/api/json/catalog.json")
        .reply(200, {
          schemas: [
            {
              url: "https://example.com/schema1.json",
              description: "example schema 1",
              fileMatch: ["valid.json"],
            },
            {
              url: "https://example.com/schema2.json",
              description: "example schema 2",
              fileMatch: ["testfiles/valid*"],
            },
          ],
        });

      return cli({ patterns: ["./testfiles/valid.json"] }).then((result) => {
        assert.equal(result, 1);
        assert(
          containsError(
            messages,
            "Could not find a schema to validate ./testfiles/valid.json"
          )
        );
        assert(
          containsInfo(
            messages,
            "Found multiple possible schemas for ./testfiles/valid.json. Possible matches:"
          )
        );
        assert(
          containsInfo(
            messages,
            "example schema 1: https://example.com/schema1.json"
          )
        );
        assert(
          containsInfo(
            messages,
            "example schema 2: https://example.com/schema2.json"
          )
        );
        mock.done();
      });
    });

    it("should return 1 if invalid response fetching user-supplied schema", async function () {
      const mock = nock("https://example.com")
        .get("/schema.json")
        .reply(404, {});

      return cli({
        patterns: ["./testfiles/valid.json"],
        schema: "https://example.com/schema.json",
      }).then((result) => {
        assert.equal(result, 1);
        assert(
          containsError(
            messages,
            "Failed fetching https://example.com/schema.json"
          )
        );
        mock.done();
      });
    });

    it("should return 98 if any glob pattern matches no files", async function () {
      return cli({
        patterns: ["./testfiles/valid.json", "./testfiles/does-not-exist.json"],
      }).then((result) => {
        assert.equal(result, 98);
        assert(
          containsError(
            messages,
            "Pattern './testfiles/does-not-exist.json' did not match any files"
          )
        );
      });
    });

    it("should return 98 if glob pattern is invalid", async function () {
      return cli({ patterns: [""] }).then((result) => {
        assert.equal(result, 98);
        assert(containsError(messages, "Pattern '' did not match any files"));
      });
    });

    it("should return 1 if target file type is not supported", async function () {
      return cli({ patterns: ["./testfiles/not-supported.txt"] }).then(
        (result) => {
          assert.equal(result, 1);
          assert(containsError(messages, "Unsupported format .txt"));
        }
      );
    });

    it("should return 1 if local schema file not found", async function () {
      return cli({
        patterns: ["./testfiles/valid.json"],
        schema: "./testfiles/does-not-exist.json",
      }).then((result) => {
        assert.equal(result, 1);
        assert(
          containsError(
            messages,
            "ENOENT: no such file or directory, open './testfiles/does-not-exist.json'"
          )
        );
      });
    });

    it("should return 1 if local catalog file not found", async function () {
      return cli({
        patterns: ["./testfiles/valid.json"],
        catalogs: ["./testfiles/does-not-exist.json"],
      }).then((result) => {
        assert.equal(result, 1);
        assert(
          containsError(
            messages,
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
        patterns: ["./testfiles/valid.json"],
        catalogs: ["https://example.com/catalog.json"],
      }).then((result) => {
        assert.equal(result, 1);
        assert(
          containsError(
            messages,
            "Failed fetching https://example.com/catalog.json"
          )
        );
        mock.done();
      });
    });

    it("should return 1 on malformed catalog (missing 'schemas')", async function () {
      const mock = nock("https://example.com")
        .get("/catalog.json")
        .reply(200, {});

      return cli({
        patterns: ["./testfiles/valid.json"],
        catalogs: ["https://example.com/catalog.json"],
      }).then((result) => {
        assert.equal(result, 1);
        mock.done();
        assert(
          containsError(
            messages,
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
        patterns: ["./testfiles/valid.json"],
        catalogs: ["https://example.com/catalog.json"],
      }).then((result) => {
        assert.equal(result, 1);
        mock.done();
        assert(
          containsError(
            messages,
            "Malformed catalog at https://example.com/catalog.json"
          )
        );
      });
    });

    it("should return 1 on malformed catalog ('schemas' elements should contains a valid url)", async function () {
      return cli({
        patterns: ["./testfiles/valid.json"],
        catalogs: ["./testfiles/catalog-local.json"],
      }).then((result) => {
        assert.equal(result, 1);
        assert(
          containsError(
            messages,
            "Malformed catalog at ./testfiles/catalog-local.json"
          )
        );
      });
    });

    it("should return 0 if ignore-errors flag is passed", async function () {
      return cli({
        patterns: ["./testfiles/not-supported.txt"],
        ignoreErrors: true,
      }).then((result) => {
        assert.equal(result, 0);
        assert(containsError(messages, "Unsupported format .txt"));
      });
    });
  });

  describe("multiple file processing", function () {
    const messages = {};
    beforeEach(() => setUp(messages));
    afterEach(() => tearDown());

    it("should return 0 if all files are valid", async function () {
      return cli({
        patterns: ["{./testfiles/valid.json,./testfiles/valid.yaml}"],
        schema: "./testfiles/schema.json",
      }).then((result) => {
        assert.equal(result, 0);
        assert(containsSuccess(messages, "is valid", 2));
      });
    });

    it("should accept multiple glob patterns", async function () {
      return cli({
        patterns: ["./testfiles/valid.json", "./testfiles/valid.yaml"],
        schema: "./testfiles/schema.json",
      }).then((result) => {
        assert.equal(result, 0);
        assert(containsSuccess(messages, "is valid", 2));
      });
    });

    it("should return 99 if any file is invalid", async function () {
      return cli({
        patterns: [
          "{./testfiles/valid.json,./testfiles/invalid.json,./testfiles/not-supported.txt}",
        ],
        schema: "./testfiles/schema.json",
      }).then((result) => {
        assert.equal(result, 99);
        assert(containsSuccess(messages, "./testfiles/valid.json is valid"));
        assert(containsError(messages, "./testfiles/invalid.json is invalid"));
        assert(containsError(messages, "Unsupported format .txt"));
      });
    });

    it("should return 1 if any file throws an error and no files are invalid", async function () {
      return cli({
        patterns: ["{./testfiles/valid.json,./testfiles/not-supported.txt}"],
        schema: "./testfiles/schema.json",
      }).then((result) => {
        assert.equal(result, 1);
        assert(containsSuccess(messages, "./testfiles/valid.json is valid"));
        assert(containsError(messages, "Unsupported format .txt"));
      });
    });

    it("should ignore errors when ignore-errors flag is passed", async function () {
      return cli({
        patterns: ["{./testfiles/valid.json,./testfiles/not-supported.txt}"],
        schema: "./testfiles/schema.json",
        ignoreErrors: true,
      }).then((result) => {
        assert.equal(result, 0);
        assert(containsSuccess(messages, "./testfiles/valid.json is valid"));
        assert(containsError(messages, "Unsupported format .txt"));
      });
    });
  });
});
