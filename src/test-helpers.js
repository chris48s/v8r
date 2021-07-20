"use strict";

const flatCache = require("flat-cache");
const cache = require("./cache.js");

const originals = {};
const consoleMethods = ["log", "error", "debug"];
const testCacheName = process.env.V8R_CACHE_NAME;

function setUp(messages) {
  flatCache.clearCacheById(testCacheName);
  consoleMethods.forEach(function (fn) {
    messages[fn] = [];
    originals[fn] = console[fn];
    console[fn] = (msg) => messages[fn].push(msg);
  });
}

function tearDown() {
  cache.resetCallCounter();
  flatCache.clearCacheById(testCacheName);
  consoleMethods.forEach(function (fn) {
    console[fn] = originals[fn];
  });
}

module.exports = { testCacheName, setUp, tearDown };
