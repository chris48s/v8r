---
sidebar_position: 7
---

# Versioning

v8r follows [semantic versioning](https://semver.org/). For this project, the "API" is defined as:

- CLI flags and options
- CLI exit codes
- The configuration file format
- The native JSON output format
- The `BasePlugin` class and `ValidationResult` type

A "breaking change" also includes:

- Dropping compatibility with a major Node JS version
- Dropping compatibility with a JSON Schema draft
