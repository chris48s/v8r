import minimatch from "minimatch";
import path from "path";
import { validate } from "./ajv.js";
import { getFromUrlOrFile } from "./io.js";
import logging from "./logging.js";

const SCHEMASTORE_CATALOG_SCHEMA_URL =
  "https://json.schemastore.org/schema-catalog.json";

async function getSchemaUrlForFilename(catalogs, filename, cache) {
  for (const [i, catalogLocation] of catalogs.entries()) {
    const catalog = await getFromUrlOrFile(catalogLocation, cache);
    const catalogSchema = await getFromUrlOrFile(
      SCHEMASTORE_CATALOG_SCHEMA_URL,
      cache
    );

    // Validate the catalog
    const valid = await validate(catalog, catalogSchema, cache);
    if (!valid || catalog.schemas === undefined) {
      throw new Error(`Malformed catalog at ${catalogLocation}`);
    }

    const { schemas } = catalog;
    const matches = getSchemaMatchesForFilename(schemas, filename);
    logging.debug(`Searching for schema in ${catalogLocation} ...`);
    if (matches.length === 1) {
      logging.info(`Found schema in ${catalogLocation} ...`);
      return matches[0].url; // Match found. We're done.
    }
    if (matches.length === 0 && i < catalogs.length - 1) {
      continue; // No match found. Try the next catalog in the array.
    }
    if (matches.length > 1) {
      // We found >1 matches in the same catalog. This is always a hard error.
      const matchesLog = matches
        .map((match) => `  ${match.description}: ${match.url}`)
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
        if (minimatch(path.normalize(filename), glob)) {
          matches.push(schema);
          break;
        }
      }
    }
  });
  return matches;
}

export { getSchemaMatchesForFilename, getSchemaUrlForFilename };
