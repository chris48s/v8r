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

function isString(el) {
  return typeof el === "string" || el instanceof String;
}

function containsSuccess(messages, expectedString, expectedCount = 1) {
  const counter = (count, el) =>
    count + (isString(el) && el.includes("✔") && el.includes(expectedString));
  return messages.log.reduce(counter, 0) === expectedCount;
}

function containsInfo(messages, expectedString, expectedCount = 1) {
  const counter = (count, el) =>
    count + (isString(el) && el.includes("ℹ") && el.includes(expectedString));
  return messages.log.reduce(counter, 0) === expectedCount;
}

function containsError(messages, expectedString, expectedCount = 1) {
  const counter = (count, el) =>
    count + (isString(el) && el.includes("✖") && el.includes(expectedString));
  return messages.error.reduce(counter, 0) === expectedCount;
}

export {
  testCacheName,
  setUp,
  tearDown,
  containsSuccess,
  containsInfo,
  containsError,
};
