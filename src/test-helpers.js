import flatCache from "flat-cache";
import logger from "./logger.js";

const origWriteOut = logger.writeOut;
const origWriteErr = logger.writeErr;
const testCacheName = process.env.V8R_CACHE_NAME;
const env = process.env;

function setUp() {
  flatCache.clearCacheById(testCacheName);
  logger.resetStdout();
  logger.resetStderr();
  logger.writeOut = function () {};
  logger.writeErr = function () {};
  process.env = { ...env };
}

function tearDown() {
  flatCache.clearCacheById(testCacheName);
  logger.resetStdout();
  logger.resetStderr();
  logger.writeOut = origWriteOut;
  logger.writeErr = origWriteErr;
  process.env = env;
}

function isString(el) {
  return typeof el === "string" || el instanceof String;
}

function logContainsSuccess(expectedString, expectedCount = 1) {
  const counter = (count, el) =>
    count + (isString(el) && el.includes("✔") && el.includes(expectedString));
  return logger.stderr.reduce(counter, 0) === expectedCount;
}

function logContainsInfo(expectedString, expectedCount = 1) {
  const counter = (count, el) =>
    count + (isString(el) && el.includes("ℹ") && el.includes(expectedString));
  return logger.stderr.reduce(counter, 0) === expectedCount;
}

function logContainsError(expectedString, expectedCount = 1) {
  const counter = (count, el) =>
    count + (isString(el) && el.includes("✖") && el.includes(expectedString));
  return logger.stderr.reduce(counter, 0) === expectedCount;
}

export {
  testCacheName,
  setUp,
  tearDown,
  logContainsSuccess,
  logContainsInfo,
  logContainsError,
};
