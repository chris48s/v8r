#!/bin/bash

set -euo pipefail

V8R_CACHE_NAME=v8r-test node --test \
  --experimental-test-coverage \
  --test-coverage-include='**/*.js' \
  --test-coverage-exclude='**/*.test.js' \
  --test-coverage-exclude='src/testhelpers.js' \
  --test-coverage-exclude='testfiles/plugins/**' \
  --test-coverage-exclude='docs/**' \
  --test-coverage-exclude='node_modules/**' \
  --test-reporter=cobertura \
  --test-reporter-destination=cobertura.xml \
  --test-reporter=spec \
  --test-reporter-destination=stdout
