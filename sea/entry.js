import ParserJson from "../src/plugins/parser-json.js";
import ParserJson5 from "../src/plugins/parser-json5.js";
import ParserToml from "../src/plugins/parser-toml.js";
import ParserYaml from "../src/plugins/parser-yaml.js";
import OutputText from "../src/plugins/output-text.js";
import OutputJson from "../src/plugins/output-json.js";

// Pre-register core plugins so they can be resolved without dynamic import()
// in the SEA context where filesystem-based imports don't work
globalThis.__seaCorePlugins = {
  "./plugins/parser-json.js": { default: ParserJson },
  "./plugins/parser-json5.js": { default: ParserJson5 },
  "./plugins/parser-toml.js": { default: ParserToml },
  "./plugins/parser-yaml.js": { default: ParserYaml },
  "./plugins/output-text.js": { default: OutputText },
  "./plugins/output-json.js": { default: OutputJson },
};

import { cli } from "../src/cli.js";

import { bootstrap } from "global-agent";
bootstrap();

cli().then((exitCode) => process.exit(exitCode));
