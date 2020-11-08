# v8r

![Build status](https://github.com/chris48s/v8r/workflows/Run%20tests/badge.svg)
![NPM version](https://img.shields.io/npm/v/v8r.svg)
![License](https://img.shields.io/npm/l/v8r.svg)
![Node Compatibility](https://img.shields.io/node/v/v8r.svg)

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
$ v8r chart.yaml
❌ Could not find a schema to validate chart.yaml

# ..you can specify one
$ v8r chart.yaml -s https://json.schemastore.org/helmfile
Validating chart.yaml against schema from https://json.schemastore.org/helmfile ...
✅ chart.yaml is valid
```

## Exit codes

v8r exits with code `0` when:

* The input file was validated against a schema and the input file was **valid**
* `v8r` was called with `--help` or `--version` flags

v8r exits with code `1` when an error was encountered trying to validate the input file. For example:

* No suitable schema could be found
* An error was encountered during an HTTP request
* The input file did not exist
* The input file was not JSON or yaml
* etc

v8r exits with code `99` when:

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

💡 No. There are some with [known issues](TODO:issue-link)

### ❓ Can `v8r` validate against a local schema?

💡 Nope. There are other better tools for this. If you want to validate against a local schema, I recommend [ajv-cli](https://github.com/ajv-validator/ajv-cli/).
