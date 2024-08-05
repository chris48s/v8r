---
sidebar_position: 7
---

# FAQ

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

💡 Yes. The `--schema` flag can be either a path to a local file or a URL. You can also use a [config file](./configuration.md) to include local schemas in a custom catalog.
