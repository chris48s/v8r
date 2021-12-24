import flatCache from "flat-cache";

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
  flatCache.clearCacheById(testCacheName);
  consoleMethods.forEach(function (fn) {
    console[fn] = originals[fn];
  });
}

export { testCacheName, setUp, tearDown };
