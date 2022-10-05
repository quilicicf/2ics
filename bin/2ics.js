#!/usr/bin/env node

// The other files are built with TypeScript.
// Run yarn run watch or yarn run build
import { run } from './index.js';

await run()
  .catch(error => process.stderr.write(`Error while cooking:\n${error.stack}\n`));
