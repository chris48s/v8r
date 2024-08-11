import fs from "fs";
import path from "path";
import { execSync } from "child_process";

function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

const tempDocsDir = "./.tempdocs";
const referenceFile = "./docs/plugins/reference.mdx";
const tempFiles = [
  { filename: path.join(tempDocsDir, "BasePlugin.mdx"), title: "BasePlugin" },
  {
    filename: path.join(tempDocsDir, "ValidationResult.mdx"),
    title: "ValidationResult",
  },
];

// clear files if they already exist
if (fs.existsSync(tempDocsDir)) {
  fs.rmSync(tempDocsDir, { recursive: true, force: true });
}
ensureDirExists(tempDocsDir);
if (fs.existsSync(referenceFile)) {
  fs.unlinkSync(referenceFile);
}

// generate from JSDoc
execSync("npx jsdoc-to-mdx -o ./.tempdocs -j jsdoc.json");

// post-processing
let combinedContent = `---
sidebar_position: 3
custom_edit_url: null
---

# Plugin API Reference

v8r plugins extend the [BasePlugin](#BasePlugin) class. Validating a document yields a [ValidationResult](#ValidationResult) object.

`;
tempFiles.forEach((file) => {
  if (fs.existsSync(file.filename)) {
    let content = fs.readFileSync(file.filename, "utf8");
    content = content
      .replace(/##/g, "###")
      .replace(
        /---\ncustom_edit_url: null\n---/g,
        `## ${file.title} {#${file.title}}`,
      )
      .replace(/<br \/>/g, " ")
      .replace(/:---:/g, "---")
      .replace(
        /\[ValidationResult\]\(ValidationResult\)/g,
        "[ValidationResult](#ValidationResult)",
      );
    combinedContent += content;
  }
});

// write out result
ensureDirExists(path.dirname(tempDocsDir));
fs.writeFileSync(referenceFile, combinedContent);
