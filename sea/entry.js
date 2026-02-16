import { cli } from "../src/cli.js";

import { bootstrap } from "global-agent";
bootstrap();

cli().then((exitCode) => process.exit(exitCode));
