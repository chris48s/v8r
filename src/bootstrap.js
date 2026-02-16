import fs from "node:fs";
import path from "node:path";
import { cosmiconfig } from "cosmiconfig";
import decamelize from "decamelize";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  validateConfigAgainstSchema,
  validateConfigDocumentParsers,
  validateConfigOutputFormats,
} from "./config-validators.js";
import logger from "./logger.js";
import { loadAllPlugins, resolveUserPlugins } from "./plugin-loader.js";
import manifest from "../package.json" with { type: "json" };

async function getCosmiConfig(cosmiconfigOptions) {
  let configFile;

  if (process.env.V8R_CONFIG_FILE) {
    if (!fs.existsSync(process.env.V8R_CONFIG_FILE)) {
      throw new Error(`File ${process.env.V8R_CONFIG_FILE} does not exist.`);
    }
    configFile = await cosmiconfig("v8r", cosmiconfigOptions).load(
      process.env.V8R_CONFIG_FILE,
    );
  } else {
    cosmiconfigOptions.stopDir = process.cwd();
    configFile = (await cosmiconfig("v8r", cosmiconfigOptions).search(
      process.cwd(),
    )) || { config: {} };
  }

  if (configFile.filepath) {
    logger.info(`Loaded config file from ${getRelativeFilePath(configFile)}`);
    logger.info(
      `Patterns and relative paths will be resolved relative to current working directory: ${process.cwd()}`,
    );
  } else {
    logger.info(`No config file found`);
  }
  return configFile;
}

function mergeConfigs(args, config) {
  const mergedConfig = { ...args };
  mergedConfig.cacheName = config?.config?.cacheName;
  mergedConfig.customCatalog = config?.config?.customCatalog;
  mergedConfig.configFileRelativePath = undefined;
  if (config.filepath) {
    mergedConfig.configFileRelativePath = getRelativeFilePath(config);
  }
  // hard-coded - this can't be set via CLI or config file
  mergedConfig.cachePrewarm = true;
  return mergedConfig;
}

function getRelativeFilePath(config) {
  return path.relative(process.cwd(), config.filepath);
}

function parseArgs(argv, config, documentFormats, outputFormats) {
  const parser = yargs(hideBin(argv));

  let command = "$0 <patterns..>";
  const patternsOpts = {
    describe:
      "One or more filenames or glob patterns describing local file or files to validate",
  };
  if (Object.keys(config.config).includes("patterns")) {
    command = "$0 [patterns..]";
    patternsOpts.default = config.config.patterns;
    patternsOpts.defaultDescription = `${JSON.stringify(
      config.config.patterns,
    )} (from config file ${getRelativeFilePath(config)})`;
  }

  const ignoreFilesOpts = {
    describe: "A list of files containing glob patterns to ignore",
  };
  let ignoreFilesDefault = [".v8rignore", ".gitignore"];
  ignoreFilesOpts.defaultDescription = `${JSON.stringify(ignoreFilesDefault)}`;
  if (Object.keys(config.config).includes("ignorePatternFiles")) {
    ignoreFilesDefault = config.config.ignorePatternFiles;
    ignoreFilesOpts.defaultDescription = `${JSON.stringify(
      ignoreFilesDefault,
    )} (from config file ${getRelativeFilePath(config)})`;
  }

  parser
    .command(
      // command
      command,

      // description
      `Validate local ${documentFormats.join("/")} files against schema(s)`,

      // builder
      (yargs) => {
        yargs.positional("patterns", patternsOpts);
      },

      // handler
      (args) => {
        /*
        Yargs doesn't allow .conflicts() with an argument that has a default
        value (it considers the arg "set" even if we just use the default)
        so we need to apply the default values here.
        */
        if (args.ignorePatternFiles === undefined) {
          args.ignorePatternFiles = args["ignore-pattern-files"] =
            ignoreFilesDefault;
        }

        if (args.ignore === false) {
          args.ignorePatternFiles = args["ignore-pattern-files"] = [];
        }

        if (args.ignore === undefined) {
          args.ignore = true;
        }
      },
    )
    .version(
      // Workaround for https://github.com/yargs/yargs/issues/1934
      // TODO: remove once fixed
      manifest.version,
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
        "Local path or URL of a schema to validate against. " +
        "If not supplied, we will attempt to find an appropriate schema on " +
        "schemastore.org using the filename. If passed with glob pattern(s) " +
        "matching multiple files, all matching files will be validated " +
        "against this schema",
    })
    .option("catalogs", {
      type: "string",
      alias: "c",
      array: true,
      describe:
        "A list of local paths or URLs of custom catalogs to use prior to schemastore.org",
    })
    .conflicts("schema", "catalogs")
    .option("ignore-errors", {
      type: "boolean",
      default: false,
      describe:
        "Exit with code 0 even if an error was encountered. Passing this flag " +
        "means a non-zero exit code is only issued if validation could be " +
        "completed successfully and one or more files were invalid",
    })
    .option("ignore-pattern-files", {
      type: "string",
      array: true,
      describe: "A list of files containing glob patterns to ignore",
      ...ignoreFilesOpts,
    })
    .option("no-ignore", {
      type: "boolean",
      describe: "Disable all ignore files",
    })
    .conflicts("ignore-pattern-files", "no-ignore")
    .option("cache-ttl", {
      type: "number",
      default: 600,
      describe:
        "Remove cached HTTP responses older than <cache-ttl> seconds old. " +
        "Passing 0 clears and disables cache completely",
    })
    .option("output-format", {
      type: "string",
      choices: outputFormats,
      default: "text",
      describe: "Output format for validation results",
    })
    .example([
      ["$0 file.json", "Validate a single file"],
      ["$0 file1.json file2.json", "Validate multiple files"],
      [
        "$0 'dir/*.yml' 'dir/*.yaml'",
        "Specify files to validate with glob patterns",
      ],
    ]);

  for (const [key, value] of Object.entries(config.config)) {
    if (["cacheTtl", "outputFormat", "ignoreErrors", "verbose"].includes(key)) {
      parser.default(
        decamelize(key, { separator: "-" }),
        value,
        `${value} (from config file ${getRelativeFilePath(config)})`,
      );
    }
  }

  return parser.argv;
}

function getDocumentFormats(loadedPlugins) {
  let documentFormats = [];
  for (const plugin of loadedPlugins) {
    documentFormats = documentFormats.concat(plugin.registerInputFileParsers());
  }
  return documentFormats;
}

function getOutputFormats(loadedPlugins) {
  let outputFormats = [];
  for (const plugin of loadedPlugins) {
    outputFormats = outputFormats.concat(plugin.registerOutputFormats());
  }
  return outputFormats;
}

async function bootstrap(argv, config, cosmiconfigOptions = {}) {
  if (config) {
    // special case for unit testing purposes
    // this allows us to inject an incomplete config and bypass the validation
    const { allLoadedPlugins, loadedCorePlugins, loadedUserPlugins } =
      await loadAllPlugins(config.plugins || []);
    return {
      config,
      allLoadedPlugins,
      loadedCorePlugins,
      loadedUserPlugins,
    };
  }

  // load the config file and validate it against the schema
  const configFile = await getCosmiConfig(cosmiconfigOptions);
  validateConfigAgainstSchema(configFile);

  // load both core and user plugins
  let plugins = resolveUserPlugins(configFile.config.plugins || []);
  const { allLoadedPlugins, loadedCorePlugins, loadedUserPlugins } =
    await loadAllPlugins(plugins);
  const documentFormats = getDocumentFormats(allLoadedPlugins);
  const outputFormats = getOutputFormats(allLoadedPlugins);

  // now we have documentFormats and outputFormats
  // we can finish validating and processing the config
  validateConfigDocumentParsers(configFile, documentFormats);
  validateConfigOutputFormats(configFile, outputFormats);

  // parse command line arguments
  const args = parseArgs(argv, configFile, documentFormats, outputFormats);

  return {
    config: mergeConfigs(args, configFile),
    allLoadedPlugins,
    loadedCorePlugins,
    loadedUserPlugins,
  };
}

export { bootstrap, getDocumentFormats, getOutputFormats, parseArgs };
