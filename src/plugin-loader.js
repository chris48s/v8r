import path from "node:path";
import { isSea } from "node:sea";
import logger from "./logger.js";
import { BasePlugin } from "./plugins.js";
import ParserJson from "./plugins/parser-json.js";
import ParserJson5 from "./plugins/parser-json5.js";
import ParserToml from "./plugins/parser-toml.js";
import ParserYaml from "./plugins/parser-yaml.js";
import OutputText from "./plugins/output-text.js";
import OutputJson from "./plugins/output-json.js";

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
    if (plugin.startsWith("file:")) {
      plugins.push(path.resolve(process.cwd(), plugin.slice(5)));
    }
  }
  return plugins;
}

function loadCorePlugins(plugins) {
  plugins.forEach((plugin) => validatePlugin(plugin));
  const loadedPlugins = plugins.map((plugin) => new plugin());
  return loadedPlugins;
}

async function loadUserPlugins(plugins) {
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
  let loadedUserPlugins = [];
  if (isSea() && userPlugins.length > 0) {
    logger.warning(
      "loading plugins is not supported when running as a standalone binary",
    );
  } else {
    loadedUserPlugins = await loadUserPlugins(userPlugins);
  }

  const corePlugins = [
    ParserJson,
    ParserJson5,
    ParserToml,
    ParserYaml,
    OutputText,
    OutputJson,
  ];
  const loadedCorePlugins = loadCorePlugins(corePlugins);

  return {
    allLoadedPlugins: loadedUserPlugins.concat(loadedCorePlugins),
    loadedCorePlugins,
    loadedUserPlugins,
  };
}

export { loadAllPlugins, resolveUserPlugins };
