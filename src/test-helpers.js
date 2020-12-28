"use strict";

const flatCache = require("flat-cache");

const originals = {};
const consoleMethods = ["log", "error", "debug"];
const testCacheName = "v8r-test";

function setUp(messages) {
  flatCache.clearCacheById(testCacheName);
  consoleMethods.forEach(function (fn) {
    messages[fn] = [];
    originals[fn] = console[fn];
    console[fn] = (msg) => messages[fn].push(msg);
  });
}

function tearDown() {
  flatCache.clearCacheById(testCacheName);
  consoleMethods.forEach(function (fn) {
    console[fn] = originals[fn];
  });
}

module.exports = { testCacheName, setUp, tearDown };
