"use strict";

const Ajv = require("ajv");
const flatCache = require("flat-cache");
const fs = require("fs");
const got = require("got");
const minimatch = require("minimatch");
const path = require("path");
const yaml = require("js-yaml");

const SCHEMASTORE_CATALOG_URL =
  "https://www.schemastore.org/api/json/catalog.json";

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

async function getSchemaUrlForFilename(filename, cache, ttl) {
  const { schemas } = await cachedFetch(SCHEMASTORE_CATALOG_URL, cache, ttl);

  const matches = [];
  schemas.forEach(function (schema) {
    if ("fileMatch" in schema) {
      if (schema.fileMatch.includes(path.basename(filename))) {
        matches.push(schema);
        return;
      }
      for (const glob of schema.fileMatch) {
        if (minimatch(path.normalize(filename), glob)) {
          matches.push(schema);
          break;
        }
      }
    }
  });

  if (matches.length === 1) {
    return matches[0].url;
  }
  if (matches.length > 1) {
    console.log(
      `Found multiple possible schemas for ${filename}. Possible matches:`
    );
    matches.forEach(function (match) {
      console.log(`${match.description}: ${match.url}`);
    });
  }
  throw new Error(`❌ Could not find a schema to validate ${filename}`);
}

function validate(data, schema) {
  const ajv = new Ajv({ schemaId: "auto" });
  ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-04.json"));
  ajv.addMetaSchema(require("ajv/lib/refs/json-schema-draft-06.json"));
  const validate = ajv.compile(schema);
  const valid = validate(data);
  if (!valid) {
    console.log("\nErrors:");
    console.log(validate.errors);
    console.log("");
  }
  return valid;
}

function parseFile(contents, format) {
  switch (format) {
    case ".json":
    case ".geojson":
    case ".jsonld":
      return JSON.parse(contents);
    case ".yml":
    case ".yaml":
      return yaml.safeLoad(contents);
    default:
      throw new Error(`❌ Unsupported format ${format}`);
  }
}

function secondsToMilliseconds(seconds) {
  return seconds * 1000;
}

function Cli(settings) {
  const cache = settings.cache || flatCache.load("v8r");

  return async function (args) {
    const filename = args.filename;
    const ttl = secondsToMilliseconds(args.cacheTtl || 0);

    const data = parseFile(
      fs.readFileSync(filename, "utf8").toString(),
      path.extname(filename)
    );
    const schemaUrl =
      args.schema || (await getSchemaUrlForFilename(filename, cache, ttl));
    const schema = await cachedFetch(schemaUrl, cache, ttl);
    console.log(`Validating ${filename} against schema from ${schemaUrl} ...`);

    const valid = validate(data, schema);
    if (valid) {
      console.log(`✅ ${filename} is valid`);
    } else {
      console.log(`❌ ${filename} is invalid`);
    }
    return valid;
  };
}

module.exports = { cachedFetch, Cli };
