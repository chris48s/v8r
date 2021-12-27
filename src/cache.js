import got from "got";
import logging from "./logging.js";

class Cache {
  constructor(flatCache, ttl) {
    this.cache = flatCache;
    this.ttl = ttl;
    this.callCounter = {};
    this.callLimit = 10;
  }

  expire() {
    Object.entries(this.cache.all()).forEach(
      function ([url, cachedResponse]) {
        if (!("timestamp" in cachedResponse) || !("body" in cachedResponse)) {
          logging.debug(`Cache error: deleting malformed response`);
          this.cache.removeKey(url);
        } else if (Date.now() > cachedResponse.timestamp + this.ttl) {
          logging.debug(`Cache stale: deleting cached response from ${url}`);
          this.cache.removeKey(url);
        }
        this.cache.save(true);
      }.bind(this)
    );
  }

  limitDepth(url) {
    /*
    It is possible to create cyclic dependencies with external references
    in JSON schema. Ajv doesn't detect this when resolving external references,
    so we keep a count of how many times we've called the same URL.
    If we are calling the same URL over and over we've probably hit a circular
    external reference and we need to break the loop.
    */
    if (url in this.callCounter) {
      this.callCounter[url]++;
    } else {
      this.callCounter[url] = 1;
    }
    if (this.callCounter[url] > this.callLimit) {
      throw new Error(
        `Called ${url} >${this.callLimit} times. Possible circular reference.`
      );
    }
  }

  resetCounters() {
    this.callCounter = {};
  }

  async fetch(url) {
    this.limitDepth(url);
    this.expire();
    const cachedResponse = this.cache.getKey(url);
    if (cachedResponse !== undefined) {
      logging.debug(`Cache hit: using cached response from ${url}`);
      return cachedResponse.body;
    }

    try {
      logging.debug(`Cache miss: calling ${url}`);
      const resp = await got(url);
      const parsedBody = JSON.parse(resp.body);
      if (this.ttl > 0) {
        this.cache.setKey(url, { timestamp: Date.now(), body: parsedBody });
        this.cache.save(true);
      }
      return parsedBody;
    } catch (error) {
      if (error.response) {
        throw new Error(`Failed fetching ${url}\n${error.response.body}`);
      }
      throw new Error(`Failed fetching ${url}`);
    }
  }
}

export { Cache };
