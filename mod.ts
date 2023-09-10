#!/usr/bin/env deno

import { stoyleGlobal, theme } from './src/dependencies/stoyle.ts';
import { run } from './src/index.ts';

await run()
  .catch((error) => console.error(stoyleGlobal`Error while cooking:\n${error.stack}`(theme.error)));
