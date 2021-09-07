#!/usr/bin/env node

import { run } from './index.js';

await run()
  .catch(error => process.stderr.write(`Error while cooking:\n${error.stack}\n`));
