"use strict";

const got = require("got");
const callLimit = 10;
let callCounter = {};

function expire(cache, ttl) {
  Object.entries(cache.all()).forEach(function ([url, cachedResponse]) {
    if (!("timestamp" in cachedResponse) || !("body" in cachedResponse)) {
      console.debug(`ℹ️ Cache error: deleting malformed response`);
      cache.removeKey(url);
    } else if (Date.now() > cachedResponse.timestamp + ttl) {
      console.debug(`ℹ️ Cache stale: deleting cached response from ${url}`);
      cache.removeKey(url);
    }
    cache.save(true);
  });
}

function limitDepth(url) {
  /*
  It is possible to create cyclic dependencies with external references
  in JSON schema. Ajv doesn't detect this when resolving external references,
  so we keep a count of how many times we've called the same URL.
  If we are calling the same URL over and over we've probably hit a circular
  external reference and we need to break the loop.
  */
  if (url in callCounter) {
    callCounter[url]++;
  } else {
    callCounter[url] = 1;
  }
  if (callCounter[url] > callLimit) {
    throw new Error(
      `❌ Called ${url} ${callLimit} times. Possible circular reference.`
    );
  }
}

async function cachedFetch(url, cache, ttl) {
  limitDepth(url);
  expire(cache, ttl);
  const cachedResponse = cache.getKey(url);
  if (cachedResponse !== undefined) {
    console.debug(`ℹ️ Cache hit: using cached response from ${url}`);
    return cachedResponse.body;
  }

  try {
    console.debug(`ℹ️ Cache miss: calling ${url}`);
    const resp = await got(url);
    const parsedBody = JSON.parse(resp.body);
    if (ttl > 0) {
      cache.setKey(url, { timestamp: Date.now(), body: parsedBody });
      cache.save(true);
    }
    return parsedBody;
  } catch (error) {
    if (error.response) {
      throw new Error(`❌ Failed fetching ${url}\n${error.response.body}`);
    }
    throw new Error(`❌ Failed fetching ${url}`);
  }
}

function resetCallCounter() {
  callCounter = {};
}

module.exports = { cachedFetch, expire, resetCallCounter };
