import minimatch from "minimatch";
import path from "path";
import { validate } from "./ajv.js";
import { getFromUrlOrFile } from "./io.js";
import logging from "./logging.js";

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
      })
    );
  }
  catalogs.push({ location: SCHEMASTORE_CATALOG_URL });
  return catalogs;
}

async function getMatchForFilename(catalogs, filename, cache) {
  for (const [i, rec] of catalogs.entries()) {
    const catalogLocation = rec.location;
    const catalog =
      rec.catalog || (await getFromUrlOrFile(catalogLocation, cache));

    if (!rec.catalog) {
      const catalogSchema = await getFromUrlOrFile(
        SCHEMASTORE_CATALOG_SCHEMA_URL,
        cache
      );

      // Validate the catalog
      const valid = await validate(catalog, catalogSchema, cache);
      if (!valid || catalog.schemas === undefined) {
        throw new Error(`Malformed catalog at ${catalogLocation}`);
      }
    }

    const { schemas } = catalog;
    const matches = getSchemaMatchesForFilename(schemas, filename);
    logging.debug(`Searching for schema in ${catalogLocation} ...`);
    if (matches.length === 1) {
      logging.info(`Found schema in ${catalogLocation} ...`);
      return coerceMatch(matches[0]); // Match found. We're done.
    }
    if (matches.length === 0 && i < catalogs.length - 1) {
      continue; // No match found. Try the next catalog in the array.
    }
    if (matches.length > 1) {
      // We found >1 matches in the same catalog. This is always a hard error.
      const matchesLog = matches
        .map(function (match) {
          let outStr = "";
          outStr += `  ${match.name}\n`;
          if (match.description) {
            outStr += `  ${match.description}\n`;
          }
          outStr += `  ${match.url || match.location}\n`;
          return outStr;
        })
        .join("\n");
      logging.info(
        `Found multiple possible schemas for ${filename}. Possible matches:\n${matchesLog}`
      );
    }
    // Either we found >1 matches in the same catalog or we found 0 matches
    // in the last catalog and there are no more catalogs left to try.
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
