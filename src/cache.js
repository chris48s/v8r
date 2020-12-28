"use strict";

const got = require("got");

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

async function cachedFetch(url, cache, ttl) {
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

module.exports = { cachedFetch, expire };
