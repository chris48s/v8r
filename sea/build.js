import esbuild from "esbuild";

const seaCompatibilityPlugin = {
  name: "sea-compatibility",
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
        // this is needed for some third-party packages
        contents = contents.replace(
          /import\.meta\.url/g,
          "globalThis[Symbol.for('__v8r_importMetaUrl')]",
        );
        modified = true;
      }

      return modified ? { contents, loader: "js" } : undefined;
    });
  },
};

await esbuild.build({
  entryPoints: ["src/index.js"],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: "build/sea-bundle.cjs",
  external: ["typescript"],
  plugins: [seaCompatibilityPlugin],
  banner: {
    js: "globalThis[Symbol.for('__v8r_importMetaUrl')] = require('url').pathToFileURL(__filename).href;",
  },
  logLevel: "info",
});
