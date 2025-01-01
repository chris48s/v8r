import got from "got";
import logger from "./logger.js";
import { parseSchema } from "./parser.js";

class Cache {
  constructor(flatCache) {
    this.cache = flatCache;
    this.ttl = this.cache._cache.ttl || 0;
    this.callCounter = {};
    this.callLimit = 10;
    if (this.ttl === 0) {
      this.cache.clear();
    }
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
        `Called ${url} >${this.callLimit} times. Possible circular reference.`,
      );
    }
  }

  resetCounters() {
    this.callCounter = {};
  }

  async fetch(url) {
    this.limitDepth(url);
    const cachedResponse = this.cache.getKey(url);
    if (cachedResponse !== undefined) {
      logger.debug(`Cache hit: using cached response from ${url}`);
      return cachedResponse.body;
    }

    try {
      logger.debug(`Cache miss: calling ${url}`);
      const resp = await got(url);
      const parsedBody = parseSchema(resp.body, url);
      if (this.ttl > 0) {
        this.cache.setKey(url, { body: parsedBody });
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
