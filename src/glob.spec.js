import assert from "node:assert";

import { getFiles } from "./glob.js";
import { setUp, tearDown } from "./test-helpers.js";

describe("getFiles", function () {
  beforeEach(function () {
    setUp();
  });

  afterEach(function () {
    tearDown();
  });

  it("matches single filename", async function () {
    const patterns = ["testfiles/files/valid.json"];
    const ignorePatternFiles = [];
    const expected = ["./testfiles/files/valid.json"];
    assert.deepStrictEqual(
      await getFiles(patterns, ignorePatternFiles),
      expected,
    );
  });

  it("matches multiple filenames", async function () {
    const patterns = [
      "testfiles/files/valid.json",
      "testfiles/files/valid.yaml",
    ];
    const ignorePatternFiles = [];
    const expected = [
      "./testfiles/files/valid.json",
      "./testfiles/files/valid.yaml",
    ];
    assert.deepStrictEqual(
      await getFiles(patterns, ignorePatternFiles),
      expected,
    );
  });

  it("matches single glob", async function () {
    const patterns = ["testfiles/files/*.yaml"];
    const ignorePatternFiles = [];
    const expected = [
      "./testfiles/files/multi-doc.yaml",
      "./testfiles/files/valid.yaml",
    ];
    assert.deepStrictEqual(
      await getFiles(patterns, ignorePatternFiles),
      expected,
    );
  });

  it("matches multiple globs", async function () {
    const patterns = ["testfiles/files/*.yaml", "testfiles/files/*.json"];
    const ignorePatternFiles = [];
    const expected = [
      "./testfiles/files/invalid.json",
      "./testfiles/files/multi-doc.yaml",
      "./testfiles/files/valid.json",
      "./testfiles/files/valid.yaml",
      "./testfiles/files/with-comments.json",
    ];
    assert.deepStrictEqual(
      await getFiles(patterns, ignorePatternFiles),
      expected,
    );
  });

  it("throws if filename not found", async function () {
    const patterns = ["testfiles/files/does-not-exist.png"];
    const ignorePatternFiles = [];
    await assert.rejects(getFiles(patterns, ignorePatternFiles), {
      name: "Error",
      message:
        "Pattern 'testfiles/files/does-not-exist.png' did not match any files",
    });
  });

  it("throws if no matches found for pattern", async function () {
    const patterns = ["testfiles/files/*.png"];
    const ignorePatternFiles = [];
    await assert.rejects(getFiles(patterns, ignorePatternFiles), {
      name: "Error",
      message: "Pattern 'testfiles/files/*.png' did not match any files",
    });
  });

  it("filters out patterns from single ignore file", async function () {
    const patterns = ["testfiles/files/*.json", "testfiles/files/*.yaml"];
    const ignorePatternFiles = ["testfiles/ignorefiles/ignore-json"];
    const expected = [
      "./testfiles/files/multi-doc.yaml",
      "./testfiles/files/valid.yaml",
    ];
    assert.deepStrictEqual(
      await getFiles(patterns, ignorePatternFiles),
      expected,
    );
  });

  it("filters out patterns from multiple ignore files", async function () {
    const patterns = [
      "testfiles/files/*.json",
      "testfiles/files/*.yaml",
      "testfiles/files/*.toml",
    ];
    const ignorePatternFiles = [
      "testfiles/ignorefiles/ignore-json",
      "testfiles/ignorefiles/ignore-yaml",
    ];
    const expected = ["./testfiles/files/valid.toml"];
    assert.deepStrictEqual(
      await getFiles(patterns, ignorePatternFiles),
      expected,
    );
  });

  it("throws if all matches filtered", async function () {
    const patterns = ["testfiles/files/*.json", "testfiles/files/*.yaml"];
    const ignorePatternFiles = [
      "testfiles/ignorefiles/ignore-json",
      "testfiles/ignorefiles/ignore-yaml",
    ];
    await assert.rejects(getFiles(patterns, ignorePatternFiles), {
      name: "Error",
      message: "Could not find any files to validate",
    });
  });
});
