import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import flatCache from "flat-cache";
import logger from "./logger.js";

chai.use(chaiAsPromised);

const origWriteOut = logger.writeOut;
const origWriteErr = logger.writeErr;
const testCacheName = process.env.V8R_CACHE_NAME;

function setUp() {
  flatCache.clearCacheById(testCacheName);
  logger.resetStdout();
  logger.resetStderr();
  logger.writeOut = function () {};
  logger.writeErr = function () {};
}

function tearDown() {
  flatCache.clearCacheById(testCacheName);
  logger.resetStdout();
  logger.resetStderr();
  logger.writeOut = origWriteOut;
  logger.writeErr = origWriteErr;
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
  chai,
  testCacheName,
  setUp,
  tearDown,
  logContainsSuccess,
  logContainsInfo,
  logContainsError,
};
