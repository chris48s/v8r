---
sidebar_position: 1
---

# Using Plugins

It is possible to extend the functionality of v8r by installing plugins.

Plugins can be packages installed from a registry like [npm](https://www.npmjs.com/) or [jsr](https://jsr.io/) or local files in your repo.

Plugins must be specified in a [config file](../configuration.md). They can't be loaded using command line arguments.

Plugins are run one at a time in the order they are specified in your config file.
