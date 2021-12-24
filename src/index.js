#!/usr/bin/env node

import { cli, parseArgs } from "./cli.js";

(async () => {
  const exitCode = await cli(parseArgs(process.argv));
  process.exit(exitCode);
})();
