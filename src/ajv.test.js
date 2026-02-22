import assert from "node:assert";
import { describe, it, after, before, beforeEach, afterEach } from "node:test";
import { FlatCache } from "flat-cache";
import { Cache } from "./cache.js";
import { _ajvFactory } from "./ajv.js";
import { testCacheName, setUp, tearDown } from "./testhelpers.js";

describe("_ajvFactory", function () {
  describe("schema drafts compatibility", function () {
    let testCache;

    before(function () {
      const ttl = 3000;
      const cache = new FlatCache({ cacheId: testCacheName, ttl: ttl });
      cache.load();
      testCache = new Cache(cache);
    });

    beforeEach(function () {
      setUp();
      testCache.cache.clear();
    });

    afterEach(function () {
      tearDown();
      testCache.cache.clear();
    });

    after(function () {
      testCache.cache.destroy();
    });

    it("should support draft-04", function () {
      const ajv = _ajvFactory(
        { $schema: "http://json-schema.org/draft-04/schema#" },
        false,
        testCache,
      );
      assert(
        Object.prototype.hasOwnProperty.call(
          ajv.schemas,
          "http://json-schema.org/draft-04/schema",
        ),
      );
    });

    it("should support draft-06", function () {
      const ajv = _ajvFactory(
        { $schema: "http://json-schema.org/draft-06/schema#" },
        false,
        testCache,
      );
      assert(
        Object.prototype.hasOwnProperty.call(
          ajv.schemas,
          "http://json-schema.org/draft-06/schema",
        ),
      );
    });

    it("should support draft-07", function () {
      const ajv = _ajvFactory(
        { $schema: "http://json-schema.org/draft-07/schema#" },
        false,
        testCache,
      );
      assert(
        Object.prototype.hasOwnProperty.call(
          ajv.schemas,
          "http://json-schema.org/draft-07/schema",
        ),
      );
    });

    it("should support draft-2019-09", function () {
      const ajv = _ajvFactory(
        { $schema: "https://json-schema.org/draft/2019-09/schema" },
        false,
        testCache,
      );
      assert(
        Object.prototype.hasOwnProperty.call(
          ajv.schemas,
          "https://json-schema.org/draft/2019-09/schema",
        ),
      );
    });

    it("should support draft-2020-12", function () {
      const ajv = _ajvFactory(
        { $schema: "https://json-schema.org/draft/2020-12/schema" },
        false,
        testCache,
      );
      assert(
        Object.prototype.hasOwnProperty.call(
          ajv.schemas,
          "https://json-schema.org/draft/2020-12/schema",
        ),
      );
    });

    it("should fall back to draft-06/draft-07 mode if $schema key is missing", function () {
      const ajv = _ajvFactory({}, false, testCache);
      assert(
        Object.prototype.hasOwnProperty.call(
          ajv.schemas,
          "http://json-schema.org/draft-06/schema",
        ),
      );
      assert(
        Object.prototype.hasOwnProperty.call(
          ajv.schemas,
          "http://json-schema.org/draft-07/schema",
        ),
      );
    });

    it("should fall back to draft-06/draft-07 mode if $schema key is invalid (str)", function () {
      const ajv = _ajvFactory({ $schema: "foobar" }, false, testCache);
      assert(
        Object.prototype.hasOwnProperty.call(
          ajv.schemas,
          "http://json-schema.org/draft-06/schema",
        ),
      );
      assert(
        Object.prototype.hasOwnProperty.call(
          ajv.schemas,
          "http://json-schema.org/draft-07/schema",
        ),
      );
    });

    it("should fall back to draft-06/draft-07 mode if $schema key is invalid (not str)", function () {
      const ajv = _ajvFactory({ $schema: true }, false, testCache);
      assert(
        Object.prototype.hasOwnProperty.call(
          ajv.schemas,
          "http://json-schema.org/draft-06/schema",
        ),
      );
      assert(
        Object.prototype.hasOwnProperty.call(
          ajv.schemas,
          "http://json-schema.org/draft-07/schema",
        ),
      );
    });
  });
});
