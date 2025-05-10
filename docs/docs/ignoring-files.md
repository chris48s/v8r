---
sidebar_position: 4
---

# Ignore Patterns

## .v8rignore and .gitignore

By default v8r looks for ignore patterns in a file called `.v8rignore` in the root of your project. `.v8rignore` uses [gitignore syntax](https://git-scm.com/docs/gitignore#_pattern_format). It also respects ignore patterns declared in `.gitignore`.

## Additional ignore files

You can tell v8r to look for ignore patterns in more files using `ignorePatternFiles` in your [config file](./configuration.md) or `--ignore-pattern-files` on the command line. You can disable all ignore pattern files by passing `--no-ignore` on the command line.

## Extglob syntax

For ad-hoc usage, it is possible to use extglob syntax with v8r. This means you can write patterns that include negations. For example if you wanted to validate all JSON files in the current directory excluding `package-lock.json` you could call

```bash
v8r './!(package-lock)*.json'
```
