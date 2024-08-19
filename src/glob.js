import { glob } from "glob";
import logger from "./logger.js";

async function getFiles(pattern) {
  try {
    return await glob(pattern, { dot: true, dotRelative: true });
  } catch (e) {
    logger.error(e.message);
    return [];
  }
}

export { getFiles };
