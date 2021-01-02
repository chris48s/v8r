#!/usr/bin/env node

"use strict";

const { cli, parseArgs } = require("./cli.js");

(async () => {
  const exitCode = await cli(parseArgs(process.argv));
  process.exit(exitCode);
})();
