---
sidebar_position: 2
---

# Writing Plugins

We can extend the functionality of v8r by writing a plugin. A plugin can be a local file contained within your project or package published to a registry like [npm](https://www.npmjs.com/) or [jsr](https://jsr.io/).

Plugins extend the [BasePlugin](../reference) class which exposes hooks that allow us customise the parsing of documents and output of results. Internally, v8r's [core parsers and output formats](https://github.com/chris48s/v8r/tree/main/src/plugins) are implemented as plugins. You can use these as a reference.

## Plugin Execution

Plugins are invoked in the following sequence:

Plugins that the user has specified in the config file are run first. These are executed in the order they are specified in the config file.

v8r's core plugins run second. The order of execution or core plugins is non-configurable.

## Hook Types

There are two patterns used by v8r plugin hooks.

### Register Hooks

- `registerDocumentFormats`
- `registerOutputFormats`

These hooks return an array of strings. Any values returned by these hooks are added to the list of formats v8r can work with.

### Early Return Hooks

- `parseDocument`
- `getSingleResultLogMessage`
- `getAllResultsLogMessage`

These hooks may optionally return or not return a value. Each plugin is run in sequence. The first plugin that returns a value "wins". That value will be used and no further plugins will be invoked. If a hook doesn't return anything, v8r will move on to the next plugin in the stack.

## Worked Example

Lets build a simple example plugin. Our plugin is going to register an output format called "emoji". If the user passes `--format emoji` the plugin will output a 👍 when the file is valid and a 👎 when the file is invalid instead of the default text log message.

```js
// Our plugin extends the BasePlugin class
import { BasePlugin } from "v8r";

class EmojiOutput extends BasePlugin {

  // v8r plugins must declare a name starting with "v8r-plugin-"
  static name = "v8r-plugin-emoji-output";

  registerOutputFormats() {
    /*
    Registering "emoji" as an output format here adds "emoji" to the list
    of values the user may pass to the --format argument.
    We could register multiple output formats here if we want,
    but we're just going to register one.
    */
    return ["emoji"];
  }

  /*
  We're going to implement the getSingleResultLogMessage hook here. This
  allows us to optionally return a log message to be written to stdout
  after each file is validated.
  */
  getSingleResultLogMessage(result, filename, format) {
    /*
    Check if the user has requested "emoji" output.
    If the user hasn't requested emoji output, we don't want to return a value.
    That will allow v8r to hand over to the next plugin in the sequence
    to check for other output formats.
    */
    if (format === "emoji") {
      // Implement our plugin logic
      if (result.valid === true) {
        return "👍";
      }
      return "👎";
    }
  }
}

// Our plugin must be an ESM module
// and the plugin class must be the default export
export default EmojiOutput;
```
