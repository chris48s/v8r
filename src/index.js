#!/usr/bin/env node

import { cli } from "./cli.js";
import { getConfig } from "./config.js";

(async () => {
  const exitCode = await cli(await getConfig(process.argv));
  process.exit(exitCode);
})();
