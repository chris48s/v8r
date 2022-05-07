import flatCache from "flat-cache";
import { Cache } from "./cache.js";
import { _ajvFactory } from "./ajv.js";
import { chai, testCacheName, setUp, tearDown } from "./test-helpers.js";

const expect = chai.expect;

describe("_ajvFactory", function () {
  describe("schema drafts compatibility", function () {
    const messages = {};
    const testCache = new Cache(flatCache.load(testCacheName), 3000);
    beforeEach(() => setUp(messages));
    afterEach(() => tearDown());

    it("should support draft-04", function () {
      const ajv = _ajvFactory(
        { $schema: "http://json-schema.org/draft-04/schema#" },
        testCache
      );
      expect(ajv.schemas).to.have.own.property(
        "http://json-schema.org/draft-04/schema"
      );
    });

    it("should support draft-06", function () {
      const ajv = _ajvFactory(
        { $schema: "http://json-schema.org/draft-06/schema#" },
        testCache
      );
      expect(ajv.schemas).to.have.own.property(
        "http://json-schema.org/draft-06/schema"
      );
    });

    it("should support draft-07", function () {
      const ajv = _ajvFactory(
        { $schema: "http://json-schema.org/draft-07/schema#" },
        testCache
      );
      expect(ajv.schemas).to.have.own.property(
        "http://json-schema.org/draft-07/schema"
      );
    });

    it("should support draft-2019-09", function () {
      const ajv = _ajvFactory(
        { $schema: "https://json-schema.org/draft/2019-09/schema" },
        testCache
      );
      expect(ajv.schemas).to.have.own.property(
        "https://json-schema.org/draft/2019-09/schema"
      );
    });

    it("should support draft-2020-12", function () {
      const ajv = _ajvFactory(
        { $schema: "https://json-schema.org/draft/2020-12/schema" },
        testCache
      );
      expect(ajv.schemas).to.have.own.property(
        "https://json-schema.org/draft/2020-12/schema"
      );
    });

    it("should fall back to draft-06/draft-07 mode if $schema key is missing", function () {
      const ajv = _ajvFactory({}, testCache);
      expect(ajv.schemas).to.have.own.property(
        "http://json-schema.org/draft-06/schema"
      );
      expect(ajv.schemas).to.have.own.property(
        "http://json-schema.org/draft-07/schema"
      );
    });

    it("should fall back to draft-06/draft-07 mode if $schema key is invalid (str)", function () {
      const ajv = _ajvFactory({ $schema: "foobar" }, testCache);
      expect(ajv.schemas).to.have.own.property(
        "http://json-schema.org/draft-06/schema"
      );
      expect(ajv.schemas).to.have.own.property(
        "http://json-schema.org/draft-07/schema"
      );
    });

    it("should fall back to draft-06/draft-07 mode if $schema key is invalid (not str)", function () {
      const ajv = _ajvFactory({ $schema: true }, testCache);
      expect(ajv.schemas).to.have.own.property(
        "http://json-schema.org/draft-06/schema"
      );
      expect(ajv.schemas).to.have.own.property(
        "http://json-schema.org/draft-07/schema"
      );
    });
  });
});