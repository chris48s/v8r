---
sidebar_position: 2
---

# Usage Examples

## Validating files

v8r can validate JSON, YAML or TOML files. You can pass filenames or glob patterns:

```bash
# single filename
$ v8r package.json

# multiple files
$ v8r file1.json file2.json

# glob patterns
$ v8r 'dir/*.yml' 'dir/*.yaml'
```

[DigitalOcean's Glob Tool](https://www.digitalocean.com/community/tools/glob) can be used to help construct glob patterns

## Manually specifying a schema

By default, v8r queries [Schema Store](https://www.schemastore.org/) to detect a suitable schema based on the filename.

```bash
# if v8r can't auto-detect a schema for your file..
$ v8r feature.geojson
ℹ Processing ./feature.geojson
✖ Could not find a schema to validate feature.geojson

# ..you can specify one using the --schema flag
$ v8r feature.geojson --schema https://json.schemastore.org/geojson
ℹ Processing ./feature.geojson
ℹ Validating feature.geojson against schema from https://json.schemastore.org/geojson ...
✔ feature.geojson is valid
```

## Using a custom catlog

Using the `--schema` flag will validate all files matched by the glob pattern against that schema. You can also define a custom [schema catalog](https://json.schemastore.org/schema-catalog.json). v8r will search any custom catalogs before falling back to [Schema Store](https://www.schemastore.org/).


```js title="my-catalog.json"
{ "$schema": "https://json.schemastore.org/schema-catalog.json",
  "version": 1,
  "schemas": [ { "name": "geojson",
                 "description": "geojson",
                 "url": "https://json.schemastore.org/geojson.json",
                 "fileMatch": ["*.geojson"] } ] }
```

```
$ v8r feature.geojson -c my-catalog.json
ℹ Processing ./feature.geojson
ℹ Found schema in my-catalog.json ...
ℹ Validating feature.geojson against schema from https://json.schemastore.org/geojson ...
✔ feature.geojson is valid
```

This can be used to specify different custom schemas for multiple file patterns.

## Files Containing Multiple Documents

A single YAML file can contain [multiple documents](https://www.yaml.info/learn/document.html). v8r is able to parse and validate these files. In this situation:

- All documents within the file are assumed to conform to the same schema. It is not possible to validate documents within the same file against different schemas
- Documents within the file are referred to as `multi-doc.yml[0]`, `multi-doc.yml[1]`, etc

```
$ v8r catalog-info.yaml
ℹ Processing ./catalog-info.yaml
ℹ Found schema in https://www.schemastore.org/api/json/catalog.json ...
ℹ Validating ./catalog-info.yaml against schema from https://json.schemastore.org/catalog-info.json ...
✔ ./catalog-info.yaml[0] is valid

✔ ./catalog-info.yaml[1] is valid
```
