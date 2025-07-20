import assert from "node:assert";
import { FlatCache } from "flat-cache";
import nock from "nock";
import { Cache } from "./cache.js";
import { testCacheName, setUp, tearDown } from "./test-helpers.js";

const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Cache", function () {
  describe("fetch function", function () {
    let testCache;

    before(function () {
      const ttl = 500;
      const cache = new FlatCache({ cacheId: testCacheName, ttl: ttl });
      cache.load();
      testCache = new Cache(cache);
    });

    beforeEach(function () {
      setUp();
    });

    afterEach(function () {
      tearDown();
    });

    after(function () {
      testCache.cache.destroy();
    });

    it("should use cached response if valid", async function () {
      nock("https://www.foobar.com").get("/baz").reply(200, { cached: false });

      testCache.cache.setKey("https://www.foobar.com/baz", {
        body: { cached: true },
      });
      const resp = await testCache.fetch("https://www.foobar.com/baz");
      assert.deepEqual(resp, { cached: true });
      nock.cleanAll();
    });

    it("should not use cached response if expired", async function () {
      const mock = nock("https://www.foobar.com")
        .get("/baz")
        .reply(200, { cached: false });

      testCache.cache.setKey("https://www.foobar.com/baz", {
        body: { cached: true },
      });

      await sleep(600);

      const resp = await testCache.fetch("https://www.foobar.com/baz");
      assert.deepEqual(resp, { cached: false });
      mock.done();
    });
  });

  describe("cyclic detection", function () {
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

    it("throws if callLimit is exceeded", async function () {
      const mock = nock("https://www.foobar.com")
        .get("/baz")
        .reply(200, { cached: false });

      testCache.callLimit = 2;
      // the first two calls should work
      await testCache.fetch("https://www.foobar.com/baz");
      await testCache.fetch("https://www.foobar.com/baz");

      //..and then the third one should fail
      await assert.rejects(testCache.fetch("https://www.foobar.com/baz"), {
        name: "Error",
        message:
          "Called https://www.foobar.com/baz >2 times. Possible circular reference.",
      });
      mock.done();
    });
  });
});
