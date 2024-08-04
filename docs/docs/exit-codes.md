---
sidebar_position: 5
---

# Exit codes

v8r always exits with code `0` when:

* The input glob pattern(s) matched one or more files, all input files were validated against a schema, and all input files were **valid**
* `v8r` was called with `--help` or `--version` flags

By default v8r exits with code `1` when an error was encountered trying to validate one or more input files. For example:

* No suitable schema could be found
* An error was encountered during an HTTP request
* An input file was not JSON or yaml
* etc

This behaviour can be modified using the `--ignore-errors` flag. When invoked with `--ignore-errors` v8r will exit with code `0` even if one of these errors was encountered while attempting validation. A non-zero exit code will only be issued if validation could be completed successfully and the file was invalid.

v8r always exits with code `97` when:

* There was an error loading a config file
* A config file was loaded but failed validation
* There was an error loading a plugin
* A plugin file was loaded but failed validation

v8r always exits with code `98` when:

* An input glob pattern was invalid
* An input glob pattern was valid but did not match any files

v8r always exits with code `99` when:

* The input glob pattern matched one or more files, one or more input files were validated against a schema and the input file was **invalid**
