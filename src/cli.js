import flatCache from "flat-cache";
import fs from "fs";
import os from "os";
import path from "path";
import isUrl from "is-url";
import { validate } from "./ajv.js";
import { bootstrap } from "./bootstrap.js";
import { Cache } from "./cache.js";
import { getCatalogs, getMatchForFilename } from "./catalogs.js";
import { getFiles } from "./glob.js";
import { getFromUrlOrFile } from "./io.js";
import logger from "./logger.js";
import { getDocumentLocation } from "./output-formatters.js";
import { parseFile } from "./parser.js";

const EXIT = {
  VALID: 0,
  ERROR: 1,
  INVALID_CONFIG_OR_PLUGIN: 97,
  NOT_FOUND: 98,
  INVALID: 99,
};

const CACHE_DIR = path.join(os.tmpdir(), "flat-cache");

function secondsToMilliseconds(seconds) {
  return seconds * 1000;
}

function getFlatCache() {
  if (process.env.V8R_CACHE_NAME) {
    return flatCache.load(process.env.V8R_CACHE_NAME);
  }
  return flatCache.load("v8r", CACHE_DIR);
}

async function validateDocument(
  fileLocation,
  documentIndex,
  document,
  schemaLocation,
  schema,
  strictMode,
  cache,
  resolver,
) {
  let result = {
    fileLocation,
    documentIndex,
    schemaLocation,
    valid: null,
    errors: [],
    code: null,
  };
  try {
    const { valid, errors } = await validate(
      document,
      schema,
      strictMode,
      cache,
      resolver,
    );
    result.valid = valid;
    result.errors = errors;

    const documentLocation = getDocumentLocation(result);
    if (valid) {
      logger.success(`${documentLocation} is valid\n`);
    } else {
      logger.error(`${documentLocation} is invalid\n`);
    }

    result.code = valid ? EXIT.VALID : EXIT.INVALID;
    return result;
  } catch (e) {
    logger.error(`${e.message}\n`);
    result.code = EXIT.ERROR;
    return result;
  }
}

async function validateFile(filename, config, plugins, cache) {
  logger.info(`Processing ${filename}`);

  let schema, schemaLocation, documents, strictMode, resolver;

  try {
    const catalogs = getCatalogs(config);
    const catalogMatch = config.schema
      ? {}
      : await getMatchForFilename(catalogs, filename, cache);
    schemaLocation = config.schema || catalogMatch.location;
    schema = await getFromUrlOrFile(schemaLocation, cache);
    logger.info(
      `Validating ${filename} against schema from ${schemaLocation} ...`,
    );

    documents = parseFile(
      plugins,
      await fs.promises.readFile(filename, "utf8"),
      filename,
      catalogMatch.parser,
    );

    strictMode = config.verbose >= 2 ? "log" : false;
    resolver = isUrl(schemaLocation)
      ? (location) => getFromUrlOrFile(location, cache)
      : (location) =>
          getFromUrlOrFile(location, cache, path.dirname(schemaLocation));
  } catch (e) {
    logger.error(`${e.message}\n`);
    return [
      {
        fileLocation: filename,
        documentIndex: null,
        schemaLocation: schemaLocation || null,
        valid: null,
        errors: [],
        code: EXIT.ERROR,
      },
    ];
  }

  let results = [];
  for (let i = 0; i < documents.length; i++) {
    const documentIndex = documents.length === 1 ? null : i;
    const result = await validateDocument(
      filename,
      documentIndex,
      documents[i],
      schemaLocation,
      schema,
      strictMode,
      cache,
      resolver,
    );

    results.push(result);

    for (const plugin of plugins) {
      const message = plugin.getSingleResultLogMessage(
        result,
        filename,
        config.format,
      );
      if (message != null) {
        logger.log(message);
        break;
      }
    }
  }
  return results;
}

function resultsToStatusCode(results, ignoreErrors) {
  const codes = Object.values(results).map((result) => result.code);
  if (codes.includes(EXIT.INVALID)) {
    return EXIT.INVALID;
  }
  if (codes.includes(EXIT.ERROR) && !ignoreErrors) {
    return EXIT.ERROR;
  }
  return EXIT.VALID;
}

function Validator() {
  return async function (config, plugins) {
    let filenames = [];
    for (const pattern of config.patterns) {
      const matches = await getFiles(pattern);
      if (matches.length === 0) {
        logger.error(`Pattern '${pattern}' did not match any files`);
        return EXIT.NOT_FOUND;
      }
      filenames = filenames.concat(matches);
    }

    // de-dupe and sort
    filenames = [...new Set(filenames)];
    filenames.sort((a, b) => a.localeCompare(b));

    const ttl = secondsToMilliseconds(config.cacheTtl || 0);
    const cache = new Cache(getFlatCache(), ttl);

    let results = [];
    for (const filename of filenames) {
      const fileResults = await validateFile(filename, config, plugins, cache);
      results = results.concat(fileResults);
      cache.resetCounters();
    }

    for (const plugin of plugins) {
      const message = plugin.getAllResultsLogMessage(results, config.format);
      if (message != null) {
        logger.log(message);
        break;
      }
    }

    return resultsToStatusCode(results, config.ignoreErrors);
  };
}

async function cli(config) {
  let allLoadedPlugins, loadedCorePlugins, loadedUserPlugins;
  try {
    ({ config, allLoadedPlugins, loadedCorePlugins, loadedUserPlugins } =
      await bootstrap(process.argv, config));
  } catch (e) {
    logger.error(e.message);
    return EXIT.INVALID_CONFIG_OR_PLUGIN;
  }

  logger.setVerbosity(config.verbose);
  logger.debug(`Merged args/config: ${JSON.stringify(config, null, 2)}`);

  /*
  Note there is a bit of a chicken and egg problem here.
  We have to load the plugins before we can load the config
  but this logger.debug() needs to happen AFTER we call logger.setVerbosity().
  */
  logger.debug(
    `Loaded user plugins: ${JSON.stringify(
      loadedUserPlugins.map((plugin) => plugin.constructor.name),
      null,
      2,
    )}`,
  );
  logger.debug(
    `Loaded core plugins: ${JSON.stringify(
      loadedCorePlugins.map((plugin) => plugin.constructor.name),
      null,
      2,
    )}`,
  );

  try {
    const validate = new Validator();
    return await validate(config, allLoadedPlugins);
  } catch (e) {
    logger.error(e.message);
    return EXIT.ERROR;
  }
}

export { cli };
