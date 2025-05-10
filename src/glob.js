import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";
import ignore from "ignore";
import logger from "./logger.js";

class NotFound extends Error {}

async function getMatches(pattern) {
  try {
    return await glob(pattern, { dot: true });
  } catch (e) {
    logger.error(e.message);
    return [];
  }
}

async function exists(path) {
  try {
    await fs.promises.access(path);
    return true;
  } catch {
    return false;
  }
}

async function filterIgnores(filenames, ignorePatterns) {
  const ig = ignore();
  for (const patterns of ignorePatterns) {
    ig.add(patterns);
  }
  return ig.filter(filenames);
}

async function readIgnoreFiles(filenames) {
  let content = [];
  for (const filename of filenames) {
    const abspath = path.join(process.cwd(), filename);
    if (await exists(abspath)) {
      content.push(await fs.promises.readFile(abspath, "utf8"));
    }
  }
  return content;
}

async function getFiles(patterns, ignorePatternFiles) {
  let filenames = [];

  // find all the files matching input globs
  for (const pattern of patterns) {
    const matches = await getMatches(pattern);
    if (matches.length === 0) {
      throw new NotFound(`Pattern '${pattern}' did not match any files`);
    }
    filenames = filenames.concat(matches);
  }

  // de-dupe
  filenames = [...new Set(filenames)];

  // process ignores
  const ignorePatterns = await readIgnoreFiles(ignorePatternFiles);
  let filteredFilenames = await filterIgnores(filenames, ignorePatterns);

  const diff = filenames.filter((x) => filteredFilenames.indexOf(x) < 0);
  if (diff.length > 0) {
    logger.debug(
      `Ignoring file(s):\n    ${diff.join("\n    ")}\nbased on ignore patterns in\n    ${ignorePatternFiles.join("\n    ")}`,
    );
  }

  // finally, sort
  filteredFilenames.sort((a, b) => a.localeCompare(b));

  if (filteredFilenames.length === 0) {
    throw new NotFound(`Could not find any files to validate`);
  }

  return filteredFilenames;
}

export { getFiles, NotFound };
