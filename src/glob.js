import { glob } from "glob";
import logger from "./logger.js";

async function getFiles(pattern) {
  try {
    let matches = await glob(pattern, { dot: true, dotRelative: true });
    matches.sort((a, b) => a.localeCompare(b));
    return matches;
  } catch (e) {
    logger.error(e.message);
    return [];
  }
}

export { getFiles };
