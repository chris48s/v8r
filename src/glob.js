import glob from "glob";
import logging from "./logging.js";

const globPromise = function (pattern, options) {
  return new Promise((resolve, reject) => {
    glob(pattern, options, (err, files) =>
      err === null ? resolve(files) : reject(err)
    );
  });
};

async function getFiles(pattern) {
  try {
    return await globPromise(pattern, { dot: true });
  } catch (e) {
    logging.error(e.message);
    return [];
  }
}

export { getFiles };
