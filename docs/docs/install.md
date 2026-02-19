---
sidebar_position: 1
---

# Installation

There are several ways to install and use v8r.

## NPX

You can invoke v8r directly from npm using npx.
Great for a one-off or ad-hoc invocation.

```bash
npx v8r@latest <filename>
```

## NPM Local Install

For javascript projects, install v8r and any plugins in your project's `package.json`.

```bash
npm install --save-dev v8r
npx v8r <filename>
```

## Standalone Binaries

There are standalone binaries for Linux, Windows and MacOS available for download from 
https://github.com/chris48s/v8r/releases/latest
If you want to use v8r to validate documents in a project that doesn't otherwise use javascript/npm, this is a good option.
