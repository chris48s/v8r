#!/bin/bash

set -euo pipefail

# read version + ensure non-empty
VERSION="$1"
[ -z "$VERSION" ] &&  echo "Error: No version specified" && exit 1

# ensure work tree is clean
if [[ -n "$(git status --porcelain)" ]]; then
    echo "Error: Uncommitted changes in work tree"
    exit 1
fi

# ensure we're on default branch
if [[ "$(git branch --show-current)" != "main" ]]; then
    echo "Error: Not on default branch"
    exit 1
fi

# ensure the changelog is up-to-date
if ! (grep -q "$VERSION" CHANGELOG.md)
then
    echo "Error: CHANGELOG.md is not up to date. Update and commit CHANGELOG.md before cutting a release"
    exit 1
fi

# confirm
read -r -p "Bump version from $(npm pkg get version | tr -d '"') to $VERSION. Are you sure? [y/n] " response
response=${response,,}  # tolower
if [[ ! "$response" =~ ^(yes|y)$ ]]; then
    exit 1
fi

# checks done, now publish the release...

# bump version
npm version "$VERSION"
# this will
# - bump the version in package.json
# - update the lockfile
# - commit
# - create a tag

# push to GitHub
git push origin "$(git branch --show-current)" --tags
