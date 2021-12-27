# v8r

![build](https://raw.githubusercontent.com/chris48s/v8r/badges/.badges/main/build-status.svg)
![coverage](https://raw.githubusercontent.com/chris48s/v8r/badges/.badges/main/coverage.svg)
![version](https://raw.githubusercontent.com/chris48s/v8r/badges/.badges/main/package-version.svg)
![license](https://raw.githubusercontent.com/chris48s/v8r/badges/.badges/main/package-license.svg)
![node](https://raw.githubusercontent.com/chris48s/v8r/badges/.badges/main/package-node-version.svg)

A command-line JSON and YAML validator that's on your wavelength.

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

v8r can validate JSON or YAML files. You can pass either a single filename or a glob pattern:

```bash
$ v8r package.json  # single filename

$ v8r '**/.eslintrc.yml'  # glob pattern
```

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

You can also define a custom [schema catalog](https://json.schemastore.org/schema-catalog.json). v8r will search any custom catalogs before falling back to [Schema Store](https://www.schemastore.org/).

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

## Exit codes

* v8r always exits with code `0` when:
    * The input glob pattern matched one or more files, all input files were validated against a schema, and all input files were **valid**
    * `v8r` was called with `--help` or `--version` flags

* By default v8r exits with code `1` when an error was encountered trying to validate one or more input files. For example:
    * No suitable schema could be found
    * An error was encountered during an HTTP request
    * An input file was not JSON or yaml
    * etc

    This behaviour can be modified using the `--ignore-errors` flag. When invoked with `--ignore-errors` v8r will exit with code `0` even if one of these errors was encountered while attempting validation. A non-zero exit code will only be issued if validation could be completed successfully and the file was invalid.

* v8r always exits with code `98` when:
    * The input glob pattern was invalid
    * The input glob pattern was valid but did not match any files

* v8r always exits with code `99` when:
    * The input glob pattern matched one or more files, one or more input files were validated against a schema and the input file was **invalid**

## FAQ

### ❓ How does `v8r` decide what schema to validate against if I don't supply one?

💡 `v8r` queries the [Schema Store catalog](https://www.schemastore.org/) to try and find a suitable schema based on the name of the input file.

### ❓ My file is valid, but it doesn't validate against one of the suggested schemas.

💡 `v8r` is a fairly thin layer of glue between [Schema Store](https://www.schemastore.org/) (where the schemas come from) and [ajv](https://www.npmjs.com/package/ajv) (the validation engine). It is likely that this kind of problem is either an issue with the schema or validation engine.

* Schema store issue tracker: https://github.com/SchemaStore/schemastore/issues
* Ajv issue tracker: https://github.com/ajv-validator/ajv/issues

### ❓ What JSON schema versions are supported?

💡 `v8r` works with JSON schema drafts:

* draft-04
* draft-06
* draft-07
* draft 2019-09
* draft 2020-12

### ❓ Will 100% of the schemas on schemastore.org work with this tool?

💡 No. There are some with [known issues](https://github.com/chris48s/v8r/issues/18)

### ❓ Can `v8r` validate against a local schema?

💡 Yes. The `--schema` flag can be either a path to a local file or a URL.
