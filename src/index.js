#!/usr/bin/env node

import { bootstrap } from "global-agent";
import { cli } from "./cli.js";

export async function main(config) {
  bootstrap();
  return cli(config);
}

if (import.meta.filename === process.argv[1]) {
  main().then((exitCode) => process.exit(exitCode));
}
