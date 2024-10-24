import path from "node:path";
import { minimatch } from "minimatch";
import { validate } from "./ajv.js";
import { getFromUrlOrFile } from "./io.js";
import logger from "./logger.js";

const SCHEMASTORE_CATALOG_URL =
  "https://www.schemastore.org/api/json/catalog.json";
const SCHEMASTORE_CATALOG_SCHEMA_URL =
  "https://json.schemastore.org/schema-catalog.json";

function coerceMatch(inMatch) {
  const outMatch = {};
  outMatch.location = inMatch.url || inMatch.location;
  for (const [key, value] of Object.entries(inMatch)) {
    if (!["location", "url"].includes(key)) {
      outMatch[key] = value;
    }
  }
  return outMatch;
}

function getCatalogs(config) {
  let catalogs = [];
  if (config.customCatalog) {
    catalogs.push({
      location: config.configFileRelativePath,
      catalog: config.customCatalog,
    });
  }
  if (config.catalogs) {
    catalogs = catalogs.concat(
      config.catalogs.map(function (loc) {
        return { location: loc };
      }),
    );
  }
  catalogs.push({ location: SCHEMASTORE_CATALOG_URL });
  return catalogs;
}

function getMatchLogMessage(match) {
  let outStr = "";
  outStr += `  ${match.name}\n`;
  if (match.description) {
    outStr += `  ${match.description}\n`;
  }
  outStr += `  ${match.url || match.location}\n`;
  return outStr;
}

function getVersionLogMessage(match, versionId, versionSchemaUrl) {
  let outStr = "";
  outStr += `  ${match.name} (${versionId})\n`;
  if (match.description) {
    outStr += `  ${match.description}\n`;
  }
  outStr += `  ${versionSchemaUrl}\n`;
  return outStr;
}

function getMultipleMatchesLogMessage(matches) {
  return matches
    .map(function (match) {
      if (Object.keys(match.versions || {}).length > 1) {
        return Object.entries(match.versions)
          .map(function ([versionId, versionSchemaUrl]) {
            return getVersionLogMessage(match, versionId, versionSchemaUrl);
          })
          .join("\n");
      }
      return getMatchLogMessage(match);
    })
    .join("\n");
}

async function getMatchForFilename(catalogs, filename, cache) {
  for (const [i, rec] of catalogs.entries()) {
    const catalogLocation = rec.location;
    const catalog =
      rec.catalog || (await getFromUrlOrFile(catalogLocation, cache));

    if (!rec.catalog) {
      const catalogSchema = await getFromUrlOrFile(
        SCHEMASTORE_CATALOG_SCHEMA_URL,
        cache,
      );

      // Validate the catalog
      const strictMode = false;
      const { valid } = await validate(
        catalog,
        catalogSchema,
        strictMode,
        cache,
      );
      if (!valid || catalog.schemas === undefined) {
        throw new Error(`Malformed catalog at ${catalogLocation}`);
      }
    }

    const { schemas } = catalog;
    const matches = getSchemaMatchesForFilename(schemas, filename);
    logger.debug(`Searching for schema in ${catalogLocation} ...`);

    if (
      (matches.length === 1 && matches[0].versions == null) ||
      (matches.length === 1 && Object.keys(matches[0].versions).length === 1)
    ) {
      logger.info(`Found schema in ${catalogLocation} ...`);
      return coerceMatch(matches[0]); // Exactly one match found. We're done.
    }

    if (matches.length === 0 && i < catalogs.length - 1) {
      continue; // No matches found. Try the next catalog in the array.
    }

    if (
      matches.length > 1 ||
      (matches.length === 1 &&
        Object.keys(matches[0].versions || {}).length > 1)
    ) {
      // We found >1 matches in the same catalog. This is always a hard error.
      const matchesLog = getMultipleMatchesLogMessage(matches);
      logger.info(
        `Found multiple possible matches for ${filename}. Possible matches:\n\n${matchesLog}`,
      );
      throw new Error(
        `Found multiple possible schemas to validate ${filename}`,
      );
    }

    // We found 0 matches in the last catalog
    // and there are no more catalogs left to try
    throw new Error(`Could not find a schema to validate ${filename}`);
  }
}

function getSchemaMatchesForFilename(schemas, filename) {
  const matches = [];
  schemas.forEach(function (schema) {
    if ("fileMatch" in schema) {
      if (schema.fileMatch.includes(path.basename(filename))) {
        matches.push(schema);
        return;
      }
      for (const glob of schema.fileMatch) {
        if (minimatch(path.normalize(filename), glob, { dot: true })) {
          matches.push(schema);
          break;
        }
      }
    }
  });
  return matches;
}

export { getCatalogs, getMatchForFilename, getSchemaMatchesForFilename };
