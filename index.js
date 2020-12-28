#!/usr/bin/env node

"use strict";

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { cli } = require("./lib.js");

const schemaHelp = `(optional) URL of schema to validate file against. If not supplied, we will attempt to find an appropriate schema on schemastore.org using the filename`;
const ignoreErrorsHelp = `(optional) Exit with code 0 even if an error was encountered. Passing this flag means a non-zero exit code is only issued if validation could be completed successfully and the file was invalid`;

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
  })
  .option("ignore-errors", {
    type: "boolean",
    describe: ignoreErrorsHelp,
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
    if (args.ignoreErrors) {
      process.exit(0);
    }
    process.exit(1);
  }
})();
