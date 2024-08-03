class BasePlugin {
  static name = "untitled plugin";

  registerDocumentFormats() {
    return [];
  }

  // eslint-disable-next-line no-unused-vars
  parseDocument(contents, filename, format) {
    return undefined;
  }

  registerOutputFormats() {
    return [];
  }

  // eslint-disable-next-line no-unused-vars
  getSingleResultLogMessage(result, filename, format) {
    return undefined;
  }

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
    if (BasePlugin.prototype[prop].length !== argCount) {
      throw new Error(
        `Error loading plugin ${plugin.name}: ${prop} must take exactly ${argCount} arguments`,
      );
    }
  }
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

export { BasePlugin, loadAllPlugins };
