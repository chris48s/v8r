#!/usr/bin/env node

import { cli } from "./cli.js";

(async () => {
  const exitCode = await cli();
  process.exit(exitCode);
})();
