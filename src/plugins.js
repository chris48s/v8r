import path from "node:path";
import logger from "./logger.js";

/**
 * Base class for all v8r plugins.
 *
 * @abstract
 */
class BasePlugin {
  /**
   * Name of the plugin. All plugins must declare a name starting with
   * `v8r-plugin-`.
   *
   * @type {string}
   * @static
   */
  static name = "untitled plugin";

  /**
   * Use the `registerInputFileParsers` hook to tell v8r about additional file
   * formats that can be parsed. Any parsers registered with this hook become
   * valid values for the `parser` property in custom schemas.
   *
   * @returns {string[]} File parsers to register
   */
  registerInputFileParsers() {
    return [];
  }

  /**
   * Use the `parseInputFile` hook to tell v8r how to parse files.
   *
   * If `parseInputFile` returns anything other than undefined, that return
   * value will be used and no further plugins will be invoked. If
   * `parseInputFile` returns undefined, v8r will move on to the next plugin in
   * the stack. The result of successfully parsing a file can either be a single
   * Document object or an array of Document objects.
   *
   * @param {string} contents - The unparsed file content.
   * @param {string} fileLocation - The file path. Filenames are resolved and
   *   normalised using dot-relative notation. This means relative paths in the
   *   current directory will be prefixed with `./` (or `.\` on Windows) even if
   *   this was not present in the input filename or pattern.
   * @param {string | undefined} parser - If the user has specified a parser to
   *   use for this file in a custom schema, this will be passed to
   *   `parseInputFile` in the `parser` param.
   * @returns {Document | Document[] | undefined} Parsed file contents
   */
  // eslint-disable-next-line no-unused-vars
  parseInputFile(contents, fileLocation, parser) {
    return undefined;
  }

  /**
   * Use the `registerOutputFormats` hook to tell v8r about additional output
   * formats that can be generated. Any formats registered with this hook become
   * valid values for the `format` property in the config file and the
   * `--format` command line argument.
   *
   * @returns {string[]} Output formats to register
   */
  registerOutputFormats() {
    return [];
  }

  /**
   * Use the `getSingleResultLogMessage` hook to provide a log message for v8r
   * to output after processing a single file.
   *
   * If `getSingleResultLogMessage` returns anything other than undefined, that
   * return value will be used and no further plugins will be invoked. If
   * `getSingleResultLogMessage` returns undefined, v8r will move on to the next
   * plugin in the stack.
   *
   * Any message returned from this function will be written to stdout.
   *
   * @param {ValidationResult} result - Result of attempting to validate this
   *   document.
   * @param {string} fileLocation - The document file path. Filenames are
   *   resolved and normalised using dot-relative notation. This means relative
   *   paths in the current directory will be prefixed with `./` (or `.\` on
   *   Windows) even if this was not present in the input filename or pattern.
   * @param {string} format - The user's requested output format as specified in
   *   the config file or via the `--format` command line argument.
   * @returns {string | undefined} Log message
   */
  // eslint-disable-next-line no-unused-vars
  getSingleResultLogMessage(result, fileLocation, format) {
    return undefined;
  }

  /**
   * Use the `getAllResultsLogMessage` hook to provide a log message for v8r to
   * output after processing all files.
   *
   * If `getAllResultsLogMessage` returns anything other than undefined, that
   * return value will be used and no further plugins will be invoked. If
   * `getAllResultsLogMessage` returns undefined, v8r will move on to the next
   * plugin in the stack.
   *
   * Any message returned from this function will be written to stdout.
   *
   * @param {ValidationResult[]} results - Results of attempting to validate
   *   these documents.
   * @param {string} format - The user's requested output format as specified in
   *   the config file or via the `--format` command line argument.
   * @returns {string | undefined} Log message
   */
  // eslint-disable-next-line no-unused-vars
  getAllResultsLogMessage(results, format) {
    return undefined;
  }
}

class Document {
  /**
   * Document is a thin wrapper class for a document we want to validate after
   * parsing a file
   *
   * @param {any} document - The object to be wrapped
   */
  constructor(document) {
    this.document = document;
  }
}

function hasProperty(plugin, prop) {
  return Object.prototype.hasOwnProperty.call(plugin.prototype, prop);
}

function validatePlugin(plugin, warnings) {
  if (
    typeof plugin.name !== "string" ||
    !plugin.name.startsWith("v8r-plugin-")
  ) {
    throw new Error(`Plugin ${plugin.name} does not declare a valid name`);
  }

  if (!(plugin.prototype instanceof BasePlugin)) {
    throw new Error(`Plugin ${plugin.name} does not extend BasePlugin`);
  }

  for (const prop of Object.getOwnPropertyNames(BasePlugin.prototype)) {
    const method = plugin.prototype[prop];
    const argCount = plugin.prototype[prop].length;
    if (typeof method !== "function") {
      throw new Error(
        `Error loading plugin ${plugin.name}: must have a method called ${method}`,
      );
    }
    const expectedArgs = BasePlugin.prototype[prop].length;
    if (expectedArgs !== argCount) {
      throw new Error(
        `Error loading plugin ${plugin.name}: ${prop} must take exactly ${expectedArgs} arguments`,
      );
    }
  }

  if (warnings === true) {
    // https://github.com/chris48s/v8r/issues/500
    if (hasProperty(plugin, "getSingleResultLogMessage")) {
      logger.warning(
        "In v8r version 5 the fileLocation argument of getSingleResultLogMessage will be removed.\n" +
          "  The signature will become getSingleResultLogMessage(result, format).\n" +
          `  ${plugin.name} will need to be updated`,
      );
    }

    // https://github.com/chris48s/v8r/issues/600
    if (
      hasProperty(plugin, "getSingleResultLogMessage") ||
      hasProperty(plugin, "getAllResultsLogMessage") ||
      hasProperty(plugin, "parseInputFile")
    ) {
      logger.warning(
        "Starting from v8r version 5 file paths will no longer be passed to plugins in dot-relative notation.\n" +
          `  ${plugin.name} may need to be updated`,
      );
    }
  }
}

function resolveUserPlugins(userPlugins) {
  let plugins = [];
  for (let plugin of userPlugins) {
    if (plugin.startsWith("package:")) {
      plugins.push(plugin.slice(8));
    }
    if (plugin.startsWith("file:")) {
      plugins.push(path.resolve(process.cwd(), plugin.slice(5)));
    }
  }
  return plugins;
}

async function loadPlugins(plugins, warnings) {
  let loadedPlugins = [];
  for (const plugin of plugins) {
    loadedPlugins.push(await import(plugin));
  }
  loadedPlugins = loadedPlugins.map((plugin) => plugin.default);
  loadedPlugins.forEach((plugin) => validatePlugin(plugin, warnings));
  loadedPlugins = loadedPlugins.map((plugin) => new plugin());
  return loadedPlugins;
}

async function loadAllPlugins(userPlugins) {
  const loadedUserPlugins = await loadPlugins(userPlugins, true);

  const corePlugins = [
    "./plugins/parser-json.js",
    "./plugins/parser-json5.js",
    "./plugins/parser-toml.js",
    "./plugins/parser-yaml.js",
    "./plugins/output-text.js",
    "./plugins/output-json.js",
  ];
  const loadedCorePlugins = await loadPlugins(corePlugins, false);

  return {
    allLoadedPlugins: loadedUserPlugins.concat(loadedCorePlugins),
    loadedCorePlugins,
    loadedUserPlugins,
  };
}

/**
 * @typedef {object} ValidationResult
 * @property {string} fileLocation - Path of the document that was validated.
 *   Filenames are resolved and normalised using dot-relative notation. This
 *   means relative paths in the current directory will be prefixed with `./`
 *   (or `.\` on Windows) even if this was not present in the input filename or
 *   pattern.
 * @property {number | null} documentIndex - Some file formats allow multiple
 *   documents to be embedded in one file (e.g:
 *   [yaml](https://www.yaml.info/learn/document.html)). In these cases,
 *   `documentIndex` identifies is used to identify the sub document within the
 *   file. `documentIndex` will be `null` when there is a one-to-one
 *   relationship between file and document.
 * @property {string | null} schemaLocation - Location of the schema used to
 *   validate this file if one could be found. `null` if no schema was found.
 * @property {boolean | null} valid - Result of the validation (true/false) if a
 *   schema was found. `null` if no schema was found and no validation could be
 *   performed.
 * @property {ErrorObject[]} errors - An array of [AJV Error
 *   Objects](https://ajv.js.org/api.html#error-objects) describing any errors
 *   encountered when validating this document.
 */

/**
 * @external ErrorObject
 * @see https://ajv.js.org/api.html#error-objects
 */

export { BasePlugin, Document, loadAllPlugins, resolveUserPlugins };
