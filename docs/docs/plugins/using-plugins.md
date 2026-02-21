---
sidebar_position: 1
---

# Using Plugins

It is possible to extend the functionality of v8r by installing plugins.

Plugins can be packages installed from a registry like [npm](https://www.npmjs.com/) or [jsr](https://jsr.io/) or local files in your repo.

Plugins must be specified in a [config file](../configuration.md). They can't be loaded using command line arguments.

```yaml title=".v8rrc.yml"
plugins:
    # Plugins installed from NPM (or JSR) must be prefixed by "package:"
    - "package:v8r-plugin-emoji-output"
    # Plugins in the project dir must be prefixed by "file:"
    - "file:./subdir/my-local-plugin.mjs"
```

Plugins are invoked one at a time in the order they are specified in your config file.

In general, there are five ways that users invoke v8r:

- Local install (recommended)
- Global install (`npm install -g v8r`)
- Ad-hoc invocation (`npx v8r@latest`)
- Standalone binary (from https://github.com/chris48s/v8r/releases)
- via [MegaLinter](https://megalinter.io/)

Each of these methods has slightly different considerations when working with plugins.

## Local Install

If you are using plugins, this is the recommended way to use v8r. In this case it is straightforward to use both NPM package plugins and local file plugins in your project. Install v8r and any plugins in your project's `package.json`. This allows you to pin your versions, co-ordinate upgrades in the event of any [breaking changes](../semver.md) and use different versions of v8r in different projects if needed.

## Global Install

It is possible to install v8r into the global environment using `npm install -g v8r`. This can be useful if you want to use v8r across lots of projects but this model may not be a good fit if you use plugins. That said, you can also install NPM package plugins into your global environment. For example `npm install -g v8r v8r-plugin-ndjson`.

As a general rule, if you have a project with a config file and local plugins, then you also want a local install of v8r. However, if you want to use local file plugins with a global install, you can run `npm link v8r` in your project dir. This will create a symlink in your project's `node_modules` dir to your global v8r install. That will then allow you to `import ... from "v8r";` in local plugins.

## Ad-hoc Invocation

It is also possible to invoke v8r directly from npm using `npx`. If you invoke v8r ad-hoc with npx, there is no way to use a local file plugin. However, you can install NPM package plugins into the temporary environment. For example:

```bash
npx --package v8r-plugin-ndjson@latest --package v8r@latest -- v8r *.json
```

For local file plugins, you will need an installation of some description.

## Standalone Binary

If you install `v8r` as a standalone binary, plugins are not currently available. Plugin compatibility may be added in a future release.

## MegaLinter

[MegaLinter](https://megalinter.io/) is a separate project, but it is one of the most common ways that users consume v8r. MegaLinter effectively gives you a global install of v8r (with the drawbacks associated with that). However the global packages live in `/node-deps`.

Similar to a standard global install, you can install NPM packages into the global (or "root") environment. For example:

```yaml title=".mega-linter.yml"
ENABLE_LINTERS:
  - JSON_V8R
JSON_V8R_CLI_LINT_MODE: project
JSON_V8R_PRE_COMMANDS:
  - command: 'npm install v8r-plugin-ndjson'
    continue_if_failed: False
    cwd: root
```

It is also possible to use local plugins with MegaLinter. The workaround for this is similar to using a global install. In this case, it is necessary to create the symlink we need manually because `npm link` doesn't know to look at the packages installed in `/node-deps`. 

```yaml title=".mega-linter.yml"
ENABLE_LINTERS:
  - JSON_V8R
JSON_V8R_CLI_LINT_MODE: project
JSON_V8R_PRE_COMMANDS:
  - command: 'mkdir -p node_modules'
    continue_if_failed: False
    cwd: workspace
  - command: 'ln -s /node-deps/node_modules/v8r node_modules/v8r'
    continue_if_failed: False
    cwd: workspace
```
