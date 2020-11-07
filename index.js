#!/usr/bin/env node

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { cli } = require("./lib.js");

const schemaHelp = `URL of schema to validate file against (optional)
If not supplied, we will attempt to find an appropriate schema on schemastore.org using the filename`;

const args = yargs(hideBin(process.argv))
  .command(
    "$0 <filename>",
    "Validate a local json/yml/yaml file against a schema",
    (yargs) => {
      yargs.positional("filename", { describe: "Local file to validate" });
    }
  )
  .option("s", {
    alias: "schema",
    type: "string",
    describe: schemaHelp,
  }).argv;

(async () => {
  try {
    const valid = await cli(args);
    if (valid) {
      process.exit(0);
    }
    process.exit(99);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
