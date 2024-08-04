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
✖ Could not find a schema to validate feature.geojson

# ..you can specify one using the --schema flag
$ v8r feature.geojson --schema https://json.schemastore.org/geojson
ℹ Validating feature.geojson against schema from https://json.schemastore.org/geojson ...
✔ feature.geojson is valid
```

## Using a custom catlog

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
