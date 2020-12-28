#!/usr/bin/env node

"use strict";

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const { Cli } = require("./lib.js");
const logging = require("./logging.js");

const args = yargs(hideBin(process.argv))
  .command(
    "$0 <filename>",
    "Validate a local json/yaml file against a schema",
    (yargs) => {
      yargs.positional("filename", { describe: "Local file to validate" });
    }
  )
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging. Can be stacked e.g: -vv -vvv",
  })
  .count("verbose")
  .option("schema", {
    alias: "s",
    type: "string",
    describe:
      "URL of schema to validate file against. If not supplied, we will attempt to find an appropriate schema on schemastore.org using the filename",
  })
  .option("ignore-errors", {
    type: "boolean",
    default: false,
    describe:
      "Exit with code 0 even if an error was encountered. Passing this flag means a non-zero exit code is only issued if validation could be completed successfully and the file was invalid",
  })
  .option("cache-ttl", {
    type: "number",
    default: 600,
    describe:
      "Remove cached HTTP responses older than <cache-ttl> seconds old. Passing 0 clears and disables cache completely",
  }).argv;

(async () => {
  logging.init(args.verbose);
  try {
    const cli = new Cli({});
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
  } finally {
    logging.cleanup();
  }
})();
