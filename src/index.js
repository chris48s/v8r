#!/usr/bin/env node

import { cli } from "./cli.js";

import { bootstrap } from "global-agent";
bootstrap();

cli().then((exitCode) => process.exit(exitCode));
