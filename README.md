# v8r

![build](https://raw.githubusercontent.com/chris48s/v8r/badges/.badges/main/build-status.svg)
![coverage](https://raw.githubusercontent.com/chris48s/v8r/badges/.badges/main/coverage.svg)
![version](https://raw.githubusercontent.com/chris48s/v8r/badges/.badges/main/package-version.svg)
![license](https://raw.githubusercontent.com/chris48s/v8r/badges/.badges/main/package-license.svg)
![node](https://raw.githubusercontent.com/chris48s/v8r/badges/.badges/main/package-node-version.svg)

v8r is a command-line JSON and YAML validator that uses [Schema Store](https://www.schemastore.org/) to detect a suitable schema for your input files based on the filename.

## Getting Started

One-off:
```bash
npx v8r@latest <filename>
```

Local install:
```bash
npm install -g v8r
v8r <filename>
```

## Usage Examples

### Validating files

v8r can validate JSON or YAML files. You can pass filenames or glob patterns:

```bash
# single filename
$ v8r package.json

# multiple files
$ v8r file1.json file2.json

# glob patterns
$ v8r 'dir/*.yml' 'dir/*.yaml'
```

[DigitalOcean's Glob Tool](https://www.digitalocean.com/community/tools/glob) can be used to help construct glob patterns

### Manually specifying a schema

By default, v8r queries [Schema Store](https://www.schemastore.org/) to detect a suitable schema based on the filename.

```bash
# if v8r can't auto-detect a schema for your file..
$ v8r feature.geojson
✖ Could not find a schema to validate feature.geojson

# ..you can specify one using the --schema flag
$ v8r feature.geojson --schema https://json.schemastore.org/geojson
ℹ Validating feature.geojson against schema from https://json.schemastore.org/geojson ...
✔ feature.geojson is valid
```

### Using a custom catlog

Using the `--schema` flag will validate all files matched by the glob pattern against that schema. You can also define a custom [schema catalog](https://json.schemastore.org/schema-catalog.json). v8r will search any custom catalogs before falling back to [Schema Store](https://www.schemastore.org/).

```bash
$ cat > my-catalog.json <<EOF
{ "\$schema": "https://json.schemastore.org/schema-catalog.json",
  "version": 1,
  "schemas": [ { "name": "geojson",
                 "description": "geojson",
                 "url": "https://json.schemastore.org/geojson.json",
                 "fileMatch": ["*.geojson"] } ] }
EOF

$ v8r feature.geojson -c my-catalog.json
ℹ Found schema in my-catalog.json ...
ℹ Validating feature.geojson against schema from https://json.schemastore.org/geojson ...
✔ feature.geojson is valid
```

This can be used to specify different custom schemas for multiple file patterns.

## Configuration

v8r uses CosmiConfig to search for a configuration. This means you can specify your configuration in any of the following places:

- `package.json`
- `.v8rrc`
- `.v8rrc.json`
- `.v8rrc.yaml`
- `.v8rrc.yml`
- `.v8rrc.js`
- `.v8rrc.cjs`
- `v8r.config.js`
- `v8r.config.cjs`

v8r only searches for a config file in the current working directory.

Example yaml config file:

```yaml
# - One or more filenames or glob patterns describing local file or files to validate
# - overridden by passing one or more positional arguments
patterns: ['*json']

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
          fileMatch: ["*.geojson"]

          # A URL or local file path for the schema location (required)
          # Unlike the SchemaStore.org format, which has a `url` key,
          # custom catalogs defined in v8r config files have a `location` key
          # which can refer to either a URL or local file.
          # Relative paths are interpreted as relative to the config file location.
          location: foo/bar/geojson-schema.json

          # A custom parser to use for files matching fileMatch
          # instead of trying to infer the correct parser from the filename (optional)
          # This property is specific to custom catalogs defined in v8r config files
          parser: json5
```

The config file format is specified more formally in a JSON Schema:

- [machine-readable JSON](config-schema.json)
- [human-readable HTML](https://json-schema-viewer.vercel.app/view?url=https%3A%2F%2Fraw.githubusercontent.com%2Fchris48s%2Fv8r%2Fmain%2Fconfig-schema.json&show_breadcrumbs=on&template_name=flat)

## Configuring a Proxy

It is possible to configure a proxy via [global-agent](https://www.npmjs.com/package/global-agent) using the `GLOBAL_AGENT_HTTP_PROXY` environment variable:

```bash
export GLOBAL_AGENT_HTTP_PROXY=http://myproxy:8888
```

## Exit codes

* v8r always exits with code `0` when:
    * The input glob pattern(s) matched one or more files, all input files were validated against a schema, and all input files were **valid**
    * `v8r` was called with `--help` or `--version` flags

* By default v8r exits with code `1` when an error was encountered trying to validate one or more input files. For example:
    * No suitable schema could be found
    * An error was encountered during an HTTP request
    * An input file was not JSON or yaml
    * etc

    This behaviour can be modified using the `--ignore-errors` flag. When invoked with `--ignore-errors` v8r will exit with code `0` even if one of these errors was encountered while attempting validation. A non-zero exit code will only be issued if validation could be completed successfully and the file was invalid.

* v8r always exits with code `97` when:
    * There was an error loading a config file
    * A config file was loaded but failed validation
    * An error was encountered when loading plugins

* v8r always exits with code `98` when:
    * An input glob pattern was invalid
    * An input glob pattern was valid but did not match any files

* v8r always exits with code `99` when:
    * The input glob pattern matched one or more files, one or more input files were validated against a schema and the input file was **invalid**

## Versioning

v8r follows [semantic versioning](https://semver.org/). For this project, the "API" is defined as:

- CLI flags and options
- CLI exit codes
- The configuration file format
- The native JSON output format

A "breaking change" also includes:

- Dropping compatibility with a major Node JS version
- Dropping compatibility with a JSON Schema draft

## FAQ

### ❓ How does `v8r` decide what schema to validate against if I don't supply one?

💡 `v8r` queries the [Schema Store catalog](https://www.schemastore.org/) to try and find a suitable schema based on the name of the input file.

### ❓ My file is valid, but it doesn't validate against one of the suggested schemas.

💡 `v8r` is a fairly thin layer of glue between [Schema Store](https://www.schemastore.org/) (where the schemas come from) and [ajv](https://www.npmjs.com/package/ajv) (the validation engine). It is likely that this kind of problem is either an issue with the schema or validation engine.

* Schema store issue tracker: https://github.com/SchemaStore/schemastore/issues
* Ajv issue tracker: https://github.com/ajv-validator/ajv/issues

### ❓ What JSON schema versions are compatible?

💡 `v8r` works with JSON schema drafts:

* draft-04
* draft-06
* draft-07
* draft 2019-09
* draft 2020-12

### ❓ Will 100% of the schemas on schemastore.org work with this tool?

💡 No. There are some with [known issues](https://github.com/chris48s/v8r/issues/18)

### ❓ Can `v8r` validate against a local schema?

💡 Yes. The `--schema` flag can be either a path to a local file or a URL. You can also use a [config file](#configuration) to include local schemas in a custom catalog.
