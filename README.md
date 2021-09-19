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
npx v8r <filename>
```

Local install:
```bash
npm install -g v8r
v8r <filename>
```

## Usage Examples

```bash
# v8r queries https://www.schemastore.org/ to detect a suitable schema based on the filename
$ v8r package.json  # v8r can validate JSON..
Validating package.json against schema from https://json.schemastore.org/package ...

Errors:
[
  {
    keyword: 'type',
    dataPath: '.name',
    schemaPath: '#/properties/name/type',
    params: { type: 'string' },
    message: 'should be string'
  }
]

❌ package.json is invalid

$ v8r action.yml  # ..and YAML
Validating action.yml against schema from https://json.schemastore.org/github-action ...
✅ action.yml is valid


# if v8r can't auto-detect a schema for your file..
$ v8r feature.geojson
❌ Could not find a schema to validate feature.geojson

# ..you can specify a schema
$ v8r feature.geojson -s https://json.schemastore.org/geojson
Validating feature.geojson against schema from https://json.schemastore.org/geojson ...
✅ feature.geojson is valid

# ..or use a custom catalog
$ cat > my-catalog.json <<EOF
{ "\$schema": "https://json.schemastore.org/schema-catalog.json",
  "version": 1,
  "schemas": [ { "name": "geojson",
                 "description": "geojson",
                 "url": "https://json.schemastore.org/geojson.json",
                 "fileMatch": ["*.geojson"] } ] }
EOF
$ v8r feature.geojson -c my-catalog.json
ℹ️ Found schema in my-catalog.json ...
Validating feature.geojson against schema from https://json.schemastore.org/geojson ...
✅ feature.geojson is valid
```

## Exit codes

* v8r always exits with code `0` when:
    * The input file was validated against a schema and the input file was **valid**
    * `v8r` was called with `--help` or `--version` flags

* By default v8r exits with code `1` when an error was encountered trying to validate the input file. For example:
    * No suitable schema could be found
    * An error was encountered during an HTTP request
    * The input file did not exist
    * The input file was not JSON or yaml
    * etc

    This behaviour can be modified using the `--ignore-errors` flag. When invoked with `--ignore-errors` v8r will exit with code `0` even if one of these errors was encountered while attempting validation. A non-zero exit code will only be issued if validation could be completed successfully and the file was invalid.

* v8r always exits with code `99` when:
    * The input file was validated against a schema and the input file was **invalid**

## FAQ

### ❓ How does `v8r` decide what schema to validate against if I don't supply one?

💡 `v8r` queries the [Schema Store catalog](https://www.schemastore.org/) to try and find a suitable schema based on the name of the input file.

### ❓ My file is valid, but it doesn't validate against one of the suggested schemas.

💡 `v8r` is a fairly thin layer of glue between [Schema Store](https://www.schemastore.org/) (where the schemas come from) and [ajv](https://www.npmjs.com/package/ajv) (the validation engine). It is likely that this kind of problem is either an issue with the schema or validation engine.

* Schema store issue tracker: https://github.com/SchemaStore/schemastore/issues
* Ajv issue tracker: https://github.com/ajv-validator/ajv/issues

### ❓ What JSON schema versions are supported?

💡 `v8r` works with JSON schema draft-04, draft-06 and draft-07.

### ❓ Will 100% of the schemas on schemastore.org work with this tool?

💡 No. There are some with [known issues](https://github.com/chris48s/v8r/issues/18)

### ❓ Can `v8r` validate against a local schema?

💡 Yes. The `--schema` flag can be either a path to a local file or a URL.
