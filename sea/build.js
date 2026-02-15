import esbuild from "esbuild";

// Plugin to replace import.meta.url with a CJS-compatible equivalent
// and to statically bundle core plugin imports
const importMetaPlugin = {
  name: "import-meta-url",
  setup(build) {
    build.onResolve({ filter: /.*/ }, () => {
      // Let esbuild handle all resolution normally
      return undefined;
    });

    // Intercept JS/MJS files and replace import.meta.url
    build.onLoad({ filter: /\.(js|mjs)$/ }, async (args) => {
      const fs = await import("node:fs");
      let contents = fs.readFileSync(args.path, "utf8");
      let modified = false;

      if (contents.includes("import.meta.url")) {
        // Replace import.meta.url with our banner-defined variable
        // which holds the file:// URL equivalent of __filename
        contents = contents.replace(/import\.meta\.url/g, "__importMetaUrl");
        modified = true;
      }

      // In plugins.js, replace dynamic import() of core plugins with
      // a lookup in the global plugin registry set by sea-entry.js
      if (args.path.endsWith("src/plugins.js")) {
        // Replace the dynamic import() in loadPlugins with a lookup
        contents = contents.replace(
          "loadedPlugins.push(await import(plugin));",
          "loadedPlugins.push((globalThis.__seaCorePlugins && globalThis.__seaCorePlugins[plugin]) || await import(plugin));",
        );
        modified = true;
      }

      // Replace createRequire-based require() calls with globalThis lookups
      // so that JSON files are resolved from the bundle, not the filesystem
      if (
        args.path.endsWith("src/config-validators.js") ||
        args.path.endsWith("src/bootstrap.js") ||
        args.path.endsWith("src/ajv.js")
      ) {
        contents = contents.replace(
          /\brequire\((["'])((?:\.\.\/|ajv\/)[^"']+\.json)\1\)/g,
          '(globalThis.__seaJsonModules && globalThis.__seaJsonModules["$2"] || require("$2"))',
        );
        modified = true;
      }

      return modified ? { contents, loader: "js" } : undefined;
    });
  },
};

await esbuild.build({
  entryPoints: ["sea/entry.js"],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: "build/sea-bundle.cjs",
  external: ["typescript"],
  plugins: [importMetaPlugin],
  banner: {
    js: "var __importMetaUrl = require('url').pathToFileURL(__filename).href;",
  },
  logLevel: "info",
});
