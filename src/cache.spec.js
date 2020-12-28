"use strict";

const chai = require("chai");
const assert = chai.assert;
const flatCache = require("flat-cache");
const nock = require("nock");
const { cachedFetch, expire } = require("./cache.js");
const { testCacheName, setUp, tearDown } = require("./test-helpers.js");

describe("Cache", function () {
  describe("cachedFetch function", function () {
    const messages = {};
    const testCache = flatCache.load(testCacheName);
    beforeEach(() => setUp(messages));
    afterEach(() => tearDown());

    it("should use cached response if valid", async function () {
      const mock = nock("https://www.foobar.com")
        .get("/baz")
        .reply(200, { cached: false });

      testCache.setKey("https://www.foobar.com/baz", {
        timestamp: Date.now(),
        body: { cached: true },
      });
      const resp = await cachedFetch(
        "https://www.foobar.com/baz",
        testCache,
        3000
      );
      assert.deepEqual(resp, { cached: true });
      nock.cleanAll();
    });

    it("should not use cached response if expired", async function () {
      const mock = nock("https://www.foobar.com")
        .get("/baz")
        .reply(200, { cached: false });

      testCache.setKey("https://www.foobar.com/baz", {
        timestamp: Date.now() - 3001,
        body: { cached: true },
      });
      const resp = await cachedFetch(
        "https://www.foobar.com/baz",
        testCache,
        3000
      );
      assert.deepEqual(resp, { cached: false });
      mock.done();
    });
  });

  describe("expire function", function () {
    const messages = {};
    const testCache = flatCache.load(testCacheName);
    beforeEach(() => setUp(messages));
    afterEach(() => tearDown());

    it("Should delete expired and malformed cache objects", async function () {
      const now = Date.now();
      testCache.setKey("expired1", {
        timestamp: now - 3001,
        body: null,
      });
      testCache.setKey("expired2", {
        timestamp: now - 20000,
        body: null,
      });
      testCache.setKey("fresh", {
        timestamp: now + 5000,
        body: null,
      });
      testCache.setKey("malformed", {
        timestamp: now + 5000,
      });
      expire(testCache, 3000);
      assert.deepEqual(Object.keys(testCache.all()), ["fresh"]);
    });
  });
});
