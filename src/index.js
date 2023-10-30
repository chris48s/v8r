#!/usr/bin/env node

import { cli } from "./cli.js";

const exitCode = await cli();
process.exit(exitCode);
