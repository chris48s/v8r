import assert from "assert";
import path from "path";

import { loadAllPlugins, resolveUserPlugins } from "./plugins.js";

describe("loadAllPlugins", function () {
  it("should load the core plugins", async function () {
    const plugins = await loadAllPlugins([]);
    assert.equal(plugins.allLoadedPlugins.length, 6);
    assert.equal(plugins.loadedCorePlugins.length, 6);
    assert.equal(plugins.loadedUserPlugins.length, 0);
  });

  it("should load valid user plugins", async function () {
    const plugins = await loadAllPlugins(["../testfiles/plugins/valid.js"]);
    assert.equal(plugins.allLoadedPlugins.length, 7);
    assert.equal(plugins.loadedCorePlugins.length, 6);
    assert.equal(plugins.loadedUserPlugins.length, 1);
  });

  it("should fail loading local plugin that does not exist", async function () {
    await assert.rejects(
      loadAllPlugins(["../testfiles/plugins/does-not-exist.js"]),
      {
        name: "Error",
        message: /^Cannot find module.*$/,
      },
    );
  });

  it("should fail loading package plugin that does not exist", async function () {
    await assert.rejects(loadAllPlugins(["does-not-exist"]), {
      name: "Error",
      message: /^Cannot find package.*$/,
    });
  });

  it("should reject plugin with invalid name", async function () {
    await assert.rejects(
      loadAllPlugins(["../testfiles/plugins/invalid-name.js"]),
      {
        name: "Error",
        message: "Plugin bad-plugin-name does not declare a valid name",
      },
    );
  });

  it("should reject plugin that does not extend BasePlugin", async function () {
    await assert.rejects(
      loadAllPlugins(["../testfiles/plugins/invalid-base.js"]),
      {
        name: "Error",
        message:
          "Plugin v8r-plugin-test-invalid-base does not extend BasePlugin",
      },
    );
  });

  it("should reject plugin with invalid parameters", async function () {
    await assert.rejects(
      loadAllPlugins(["../testfiles/plugins/invalid-params.js"]),
      {
        name: "Error",
        message:
          "Error loading plugin v8r-plugin-test-invalid-params: registerDocumentParsers must take exactly 0 arguments",
      },
    );
  });
});

describe("resolveUserPlugins", function () {
  it("should resolve both local: and package: plugins", async function () {
    const resolvedPlugins = resolveUserPlugins([
      "package:v8r-plugin-emoji-output",
      "local:./testfiles/plugins/valid.js",
    ]);

    assert.equal(resolvedPlugins.length, 2);

    assert.equal(resolvedPlugins[0], "v8r-plugin-emoji-output");

    assert(path.isAbsolute(resolvedPlugins[1]));
    assert(resolvedPlugins[1].endsWith("/testfiles/plugins/valid.js"));
  });
});
