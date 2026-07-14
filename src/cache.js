import Mutex from "p-mutex";
import logger from "./logger.js";
import { parseSchema } from "./parser.js";

class Cache {
  constructor(flatCache) {
    this.cache = flatCache;
    this.ttl = this.cache._cache.ttl || 0;
    this.callCounter = {};
    this.locks = {};
    this.callLimit = 10;
    if (this.ttl === 0) {
      this.cache.clear();
    }
  }

  getMutex(url) {
    if (!(url in this.locks)) {
      this.locks[url] = new Mutex();
    }
    return this.locks[url];
  }

  async limitDepth(url) {
    /*
    It is possible to create cyclic dependencies with external references
    in JSON schema.
    We try to mitigate this issue during cache pre-warming.
    Ajv doesn't detect this when resolving external references,
    so we keep a count of how many times we've called the same URL.
    If we are calling the same URL over and over we've probably hit a circular
    external reference and we need to break the loop.
    */
    const mutex = this.getMutex(url);

    await mutex.withLock(async () => {
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
    });
  }

  resetCounters() {
    this.callCounter = {};
  }

  async fetch(url, persist = true) {
    await this.limitDepth(url);
    const cachedResponse = this.cache.get(url);
    if (cachedResponse !== undefined) {
      logger.debug(`Cache hit: using cached response from ${url}`);
      return cachedResponse.body;
    }

    logger.debug(`Cache miss: calling ${url}`);
    let resp;
    try {
      resp = await fetch(url);
    } catch (error) {
      throw new Error(`Failed fetching ${url}`, { cause: error });
    }

    const responseBody = await resp.text();
    if (!resp.ok) {
      throw new Error(`Failed fetching ${url}\n${responseBody}`);
    }

    const parsedBody = parseSchema(responseBody, url);
    if (this.ttl > 0) {
      this.cache.set(url, { body: parsedBody });
      const finalUrl = resp.url;
      if (finalUrl !== url) {
        this.cache.set(finalUrl, { body: parsedBody });
      }
      if (persist) {
        this.cache.save(true);
      }
    }
    return parsedBody;
  }

  persist() {
    this.cache.save(true);
  }

  get(key) {
    return this.cache.get(key);
  }
}

export { Cache };
