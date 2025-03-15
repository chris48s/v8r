---
sidebar_position: 3
---

# Configuration

v8r uses [CosmiConfig](https://www.npmjs.com/package/cosmiconfig) to search for a configuration. This means you can specify your configuration in any of the following places:

- `package.json`
- `.v8rrc`
- `.v8rrc.json`
- `.v8rrc.yaml`
- `.v8rrc.yml`
- `.v8rrc.js`
- `.v8rrc.cjs`
- `v8r.config.js`
- `v8r.config.cjs`

By default, v8r searches for a config file in the current working directory.

If you want to load a config file from another location, you can invoke v8r with the `V8R_CONFIG_FILE` environment variable. All patterns and relative paths in the config file will be resolved relative to the current working directory rather than the config file location, even if the config file is loaded from somewhere other than the current working directory.

Example yaml config file:

```yaml title=".v8rrc.yml"
# - One or more filenames or glob patterns describing local file or files to validate
#   Patterns are resolved relative to the current working directory.
# - overridden by passing one or more positional arguments
patterns: ['*.json']

# - Level of verbose logging. 0 is standard, higher numbers are more verbose
# - overridden by passing --verbose / -v
# - default = 0
verbose: 2

# - Exit with code 0 even if an error was encountered. True means a non-zero exit
#   code is only issued if validation could be completed successfully and one or
#   more files were invalid
# - overridden by passing --ignore-errors
# - default = false
ignoreErrors: true

# - Remove cached HTTP responses older than cacheTtl seconds old.
#   Specifying 0 clears and disables cache completely
# - overridden by passing --cache-ttl
# - default = 600
cacheTtl: 86400

# - Output format for validation results
# - overridden by passing --format
# - default = text
format: "json"

# - A list of files containing glob patterns to ignore
#   Set this to [] to disable all ignore files
# - overridden by passing --ignore-pattern-files or --no-ignore
# - default = [".v8rignore"]
#   note: The default value of this param will change to
#   [".gitignore", ".v8rignore"] in version 5
ignorePatternFiles: []

# - A custom schema catalog.
#   This catalog will be searched ahead of any custom catalogs passed using
#   --catalogs or SchemaStore.org
#   The format of this is subtly different to the format of a catalog
#   passed via --catalogs (which matches the SchemaStore.org format)
customCatalog:
    schemas:
        - name: Custom Schema  # The name of the schema (required)
          description: Custom Schema  # A description of the schema (optional)

          # A Minimatch glob expression for matching up file names with a schema (required)
          # Expressions are resolved relative to the current working directory.
          fileMatch: ["*.geojson"]

          # A URL or local file path for the schema location (required)
          # Unlike the SchemaStore.org format, which has a `url` key,
          # custom catalogs defined in v8r config files have a `location` key
          # which can refer to either a URL or local file.
          # Relative paths are resolved relative to the current working directory.
          location: foo/bar/geojson-schema.json

          # A custom parser to use for files matching fileMatch
          # instead of trying to infer the correct parser from the filename (optional)
          # This property is specific to custom catalogs defined in v8r config files
          parser: json5

# - An array of v8r plugins to load
# - Plugins can only be specified in the config file.
#   They can't be loaded using command line arguments
plugins:
    # Plugins installed from NPM (or JSR) must be prefixed by "package:"
    - "package:v8r-plugin-emoji-output"
    # Plugins in the project dir must be prefixed by "file:"
    # Relative paths are resolved relative to the current working directory.
    - "file:./subdir/my-local-plugin.mjs"
```

The config file format is specified more formally in a JSON Schema:

- [machine-readable JSON](https://github.com/chris48s/v8r/blob/main/config-schema.json)
- [human-readable HTML](https://json-schema-viewer.vercel.app/view?url=https%3A%2F%2Fraw.githubusercontent.com%2Fchris48s%2Fv8r%2Fmain%2Fconfig-schema.json&show_breadcrumbs=on&template_name=flat)
