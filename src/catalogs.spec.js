import chai from "chai";
import { getSchemaMatchesForFilename } from "./catalogs.js";

const expect = chai.expect;

describe("getSchemaMatchesForFilename", function () {
  const schemas = [
    {
      url: "https://example.com/subdir-schema.json",
      fileMatch: ["subdir/**/*.json"],
    },
    {
      url: "https://example.com/files-schema-schema.json",
      fileMatch: ["file1.json", "file2.json"],
    },
    {
      url: "https://example.com/duplicate.json",
      fileMatch: ["file2.json"],
    },
    {
      url: "https://example.com/starts-with-a-dot-schema.json",
      fileMatch: ["*.starts-with-a-dot.json"],
    },
  ];

  it("returns [] when no matches found", function () {
    expect(
      getSchemaMatchesForFilename(schemas, "doesnt-match-anything.json")
    ).to.deep.equal([]);
  });

  it("returns a match using globstar pattern", function () {
    expect(
      getSchemaMatchesForFilename(schemas, "subdir/one/two/three/file.json")
    ).to.deep.equal([
      {
        url: "https://example.com/subdir-schema.json",
        fileMatch: ["subdir/**/*.json"],
      },
    ]);
  });

  it("returns a match when fileMatch contains multiple patterns", function () {
    expect(getSchemaMatchesForFilename(schemas, "file1.json")).to.deep.equal([
      {
        url: "https://example.com/files-schema-schema.json",
        fileMatch: ["file1.json", "file2.json"],
      },
    ]);
  });

  it("returns multiple matches if input matches >1 globs", function () {
    expect(getSchemaMatchesForFilename(schemas, "file2.json")).to.deep.equal([
      {
        url: "https://example.com/files-schema-schema.json",
        fileMatch: ["file1.json", "file2.json"],
      },
      {
        url: "https://example.com/duplicate.json",
        fileMatch: ["file2.json"],
      },
    ]);
  });

  it("returns a match if filename starts with a dot", function () {
    expect(
      getSchemaMatchesForFilename(schemas, ".starts-with-a-dot.json")
    ).to.deep.equal([
      {
        url: "https://example.com/starts-with-a-dot-schema.json",
        fileMatch: ["*.starts-with-a-dot.json"],
      },
    ]);
  });
});
