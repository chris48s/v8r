import assert from "assert";
import flatCache from "flat-cache";
import nock from "nock";
import { Cache } from "./cache.js";
import { testCacheName, setUp, tearDown } from "./test-helpers.js";

describe("Cache", function () {
  describe("fetch function", function () {
    const testCache = new Cache(flatCache.load(testCacheName), 3000);
    beforeEach(() => setUp());
    afterEach(() => tearDown());

    it("should use cached response if valid", async function () {
      nock("https://www.foobar.com").get("/baz").reply(200, { cached: false });

      testCache.cache.setKey("https://www.foobar.com/baz", {
        timestamp: Date.now(),
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
        timestamp: Date.now() - 3001,
        body: { cached: true },
      });
      const resp = await testCache.fetch("https://www.foobar.com/baz");
      assert.deepEqual(resp, { cached: false });
      mock.done();
    });
  });

  describe("cyclic detection", function () {
    const testCache = new Cache(flatCache.load(testCacheName), 3000);
    beforeEach(() => setUp());
    afterEach(() => tearDown());

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

  describe("expire function", function () {
    const testCache = new Cache(flatCache.load(testCacheName), 3000);
    beforeEach(() => setUp());
    afterEach(() => tearDown());

    it("should delete expired and malformed cache objects", async function () {
      const now = Date.now();
      testCache.cache.setKey("expired1", {
        timestamp: now - 3001,
        body: null,
      });
      testCache.cache.setKey("expired2", {
        timestamp: now - 20000,
        body: null,
      });
      testCache.cache.setKey("fresh", {
        timestamp: now + 5000,
        body: null,
      });
      testCache.cache.setKey("malformed", {
        timestamp: now + 5000,
      });
      testCache.expire();
      assert.deepEqual(Object.keys(testCache.cache.all()), ["fresh"]);
    });
  });
});
