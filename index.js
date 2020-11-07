#!/usr/bin/env node

const { cli } = require("./lib.js");

const args = process.argv;

(async () => {
  try {
    const valid = await cli(args);
    if (valid) {
      process.exit(0);
    }
    process.exit(1);
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
})();
