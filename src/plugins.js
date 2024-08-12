import path from "path";

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
   * Use the `registerDocumentParsers` hook to tell v8r about additional
   * document formats that can be parsed. Any parsers registered with this hook
   * become valid values for the `parser` property in custom schemas.
   *
   * @returns {string[]} Document parsers to register
   */
  registerDocumentParsers() {
    return [];
  }

  /**
   * Use the `parseDocument` hook to tell v8r how to parse documents.
   *
   * If `parseDocument` returns anything other than undefined, that return value
   * will be used and no further plugins will be invoked. If `parseDocument`
   * returns undefined, v8r will move on to the next plugin in the stack.
   *
   * @param {string} contents - The unparsed document file content.
   * @param {string} filename - The document filename.
   * @param {string | undefined} parser - If this filename matched a document
   *   parser the user has specified in a custom schema, this will be passed to
   *   `parseDocument` in the `parser` param.
   * @returns {object | undefined} Parsed file contents
   */
  // eslint-disable-next-line no-unused-vars
  parseDocument(contents, filename, parser) {
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
   * Any mesage returned from this function will be written to stdout.
   *
   * @param {ValidationResult} result - Result of attempting to validate this
   *   document.
   * @param {string} filename - The document filename.
   * @param {string} format - The user's requested output format as specified in
   *   the config file or via the `--format` command line argument.
   * @returns {string | undefined} Log message
   */
  // eslint-disable-next-line no-unused-vars
  getSingleResultLogMessage(result, filename, format) {
    return undefined;
  }

  // the recommended syntax here would be { [filename: string]: ValidationResult }
  // however jsdoc-to-mdx does not render this as expected
  /* eslint-disable jsdoc/check-types */
  /**
   * Use the `getAllResultsLogMessage` hook to provide a log message for v8r to
   * output after processing all files.
   *
   * If `getAllResultsLogMessage` returns anything other than undefined, that
   * return value will be used and no further plugins will be invoked. If
   * `getAllResultsLogMessage` returns undefined, v8r will move on to the next
   * plugin in the stack.
   *
   * Any mesage returned from this function will be written to stdout.
   *
   * @param {Object<string, ValidationResult>} results - Results of attempting
   *   to validate these documents. This object is a key/value map of (string)
   *   filename to [ValidationResult](#ValidationResult) object.
   * @param {string} format - The user's requested output format as specified in
   *   the config file or via the `--format` command line argument.
   * @returns {string | undefined} Log message
   */
  // eslint-disable-next-line no-unused-vars
  getAllResultsLogMessage(results, format) {
    return undefined;
  }
}

function validatePlugin(plugin) {
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
}

function resolveUserPlugins(userPlugins) {
  let plugins = [];
  for (let plugin of userPlugins) {
    if (plugin.startsWith("package:")) {
      plugins.push(plugin.slice(8));
    }
    if (plugin.startsWith("local:")) {
      plugins.push(path.resolve(process.cwd(), plugin.slice(6)));
    }
  }
  return plugins;
}

async function loadPlugins(plugins) {
  let loadedPlugins = [];
  for (const plugin of plugins) {
    loadedPlugins.push(await import(plugin));
  }
  loadedPlugins = loadedPlugins.map((plugin) => plugin.default);
  loadedPlugins.forEach((plugin) => validatePlugin(plugin));
  loadedPlugins = loadedPlugins.map((plugin) => new plugin());
  return loadedPlugins;
}

async function loadAllPlugins(userPlugins) {
  const loadedUserPlugins = await loadPlugins(userPlugins);

  const corePlugins = [
    "./plugins/parser-json.js",
    "./plugins/parser-json5.js",
    "./plugins/parser-toml.js",
    "./plugins/parser-yaml.js",
    "./plugins/output-text.js",
    "./plugins/output-json.js",
  ];
  const loadedCorePlugins = await loadPlugins(corePlugins);

  return {
    allLoadedPlugins: loadedUserPlugins.concat(loadedCorePlugins),
    loadedCorePlugins,
    loadedUserPlugins,
  };
}

/**
 * @typedef {object} ValidationResult
 * @property {string} fileLocation - Filename of the document that was
 *   validated.
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

export { BasePlugin, loadAllPlugins, resolveUserPlugins };
