#!/usr/bin/env node

import { cli } from "./cli.js";

export async function main(config) {
  return cli(config);
}

if (import.meta.filename === process.argv[1]) {
  main().then((exitCode) => process.exit(exitCode));
}
