# Changelog

## 📦 [3.1.0](https://www.npmjs.com/package/v8r/v/3.1.0) - 2024-06-03

* Add ability to configure a proxy using global-agent

## 📦 [3.0.0](https://www.npmjs.com/package/v8r/v/3.0.0) - 2024-01-25

* Drop compatibility with node 16
* Add ability to validate Toml documents

## 📦 [2.1.0](https://www.npmjs.com/package/v8r/v/2.1.0) - 2023-10-23

* Add compatibility with JSON schemas serialized as Yaml

## 📦 [2.0.0](https://www.npmjs.com/package/v8r/v/2.0.0) - 2023-05-02

* Drop compatibility with node 14
* Upgrade glob and minimatch to latest versions
* Tested on node 20

## 📦 [1.0.0](https://www.npmjs.com/package/v8r/v/1.0.0) - 2023-03-12

Version 1.0.0 contains no new features and no bug fixes.
The one change in this release is that the project now publishes a
[SemVer compatibility statement](https://github.com/chris48s/v8r/blob/main/README.md#versioning).

## 📦 [0.14.0](https://www.npmjs.com/package/v8r/v/0.14.0) - 2023-01-28

* Throw an error if multiple versions of a schema are found in the catalog,
  instead of assuming the latest version

## 📦 [0.13.1](https://www.npmjs.com/package/v8r/v/0.13.1) - 2022-12-10

* Resolve external `$ref`s in local schemas

## 📦 [0.13.0](https://www.npmjs.com/package/v8r/v/0.13.0) - 2022-06-11

* Overhaul of CLI output/machine-readable output. Validation results are sent to stdout. Log messages are now sent to stderr only. Pass `--format [text|json] (default: text)` to specify what is sent to stdout.

## 📦 [0.12.0](https://www.npmjs.com/package/v8r/v/0.12.0) - 2022-05-07

* Add config file. See https://github.com/chris48s/v8r/blob/main/README.md#configuration for more details.

## 📦 [0.11.1](https://www.npmjs.com/package/v8r/v/0.11.1) - 2022-03-03

* Fix: call minimatch with `{dot: true}`, fixes [#174](https://github.com/chris48s/v8r/issues/174)

## 📦 [0.11.0](https://www.npmjs.com/package/v8r/v/0.11.0) - 2022-02-27

* Drop compatibility with node 12, now requires node `^14.13.1 || >=15.0.0`
* Upgrade to got 12 internally
* Call ajv with `allErrors` flag

## 📦 [0.10.1](https://www.npmjs.com/package/v8r/v/0.10.1) - 2022-01-06

* Fix `--version` flag when installed globally in some environments

## 📦 [0.10.0](https://www.npmjs.com/package/v8r/v/0.10.0) - 2022-01-03

* Accept multiple filenames or globs as positional args. e.g:
  ```bash
  v8r file1.json file2.json 'dir/*.yaml'
  ```

## 📦 [0.9.0](https://www.npmjs.com/package/v8r/v/0.9.0) - 2021-12-27

* Accept glob pattern instead of filename. It is now possible to validate multiple files at once. e.g:
  ```bash
  v8r '{file1.json,file2.json}'
  v8r 'files/*'
  ```
* Improvements to terminal output styling
* `.jsonc` and `.json5` files can now be validated

## 📦 [0.8.1](https://www.npmjs.com/package/v8r/v/0.8.1) - 2021-12-25

* Fix `--version` flag when installed globally

## 📦 [0.8.0](https://www.npmjs.com/package/v8r/v/0.8.0) - 2021-12-25

* Switch from CommonJS to ESModules internally
* Requires node `^12.20.0 || ^14.13.1 || >=15.0.0`

## 📦 [0.7.0](https://www.npmjs.com/package/v8r/v/0.7.0) - 2021-11-30

* Upgrade to ajv 8 internally
  Adds compatibility for JSON Schema draft 2019-09 and draft 2020-12
* Docs/logging improvements to clarify behaviour of `--catalogs` param

## 📦 [0.6.1](https://www.npmjs.com/package/v8r/v/0.6.1) - 2021-08-06

* Refactor cache module to remove global state

## 📦 [0.6.0](https://www.npmjs.com/package/v8r/v/0.6.0) - 2021-07-28

* Add the ability to search custom schema catalogs using the `--catalogs` param

## 📦 [0.5.0](https://www.npmjs.com/package/v8r/v/0.5.0) - 2021-01-13

* Allow validation against a local schema
* Move cache file to OS temp dir

## 📦 [0.4.0](https://www.npmjs.com/package/v8r/v/0.4.0) - 2020-12-30

* Resolve external references in schemas

## 📦 [0.3.0](https://www.npmjs.com/package/v8r/v/0.3.0) - 2020-12-29

* Cache HTTP responses locally to improve performance
* Add `--verbose` flag

## 📦 [0.2.0](https://www.npmjs.com/package/v8r/v/0.2.0) - 2020-12-24

* Find schemas using paths and glob patterns
* Add `--ignore-errors` flag

## 📦 [0.1.1](https://www.npmjs.com/package/v8r/v/0.1.1) - 2020-11-08

* Add Documentation
* Recognise `.geojson` and `.jsonld` as JSON files

## 📦 [0.1.0](https://www.npmjs.com/package/v8r/v/0.1.0) - 2020-11-08

* First Release
