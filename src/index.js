#!/usr/bin/env node

import { cli } from "./cli.js";

import { bootstrap } from "global-agent";
bootstrap();

const exitCode = await cli();
process.exit(exitCode);
