import { yargs } from './dependencies/yargs.ts';
import { stoyle, stoyleGlobal, theme } from './dependencies/stoyle.ts';
import { exists } from './dependencies/fs.ts';

import { CliOptions, cook } from './cook.ts';

interface RawCliOptions {
  source: string;
  output: string;
  useRecipe: string;
  writeRecipe: string;
}

const USE_RECIPE_OPTION = 'use-recipe';
const WRITE_RECIPE_OPTION = 'write-recipe';

export async function run (): Promise<void> {
  const rawOptions: RawCliOptions = await yargs
    .usage(`USAGE: 2ics \\\n\t--source /tmp/input.csv \\\n\t--output /tmp/output.ics \\\n\t--write-recipe /tmp/recipe.json`)
    .option('source', { // TODO: no positional at top-level?
      alias: 's',
      type: 'string',
      describe: 'The path to the source file',
      requiresArg: true,
      demandOption: true,
      async coerce (filePath: string): Promise<string> {
        if (!(await exists(filePath))) {
          throw Error(stoyleGlobal`The source file was not found`(theme.error));
        }
        return Deno.readTextFile(filePath);
      },
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      describe: 'The path where to where the *.ics file will be written',
      requiresArg: true,
      demandOption: true,
      async coerce (filePath: string): Promise<string> {
        if (await exists(filePath) && (await Deno.stat(filePath)).isDirectory) {
          throw Error(stoyleGlobal`The output path leads to a folder, should be a file`(theme.error));
        }
        return filePath;
      },
    })
    .option(USE_RECIPE_OPTION, {
      alias: 'r',
      type: 'string',
      describe: stoyle`The path to a recipe that will be cooked. Mutually exclusive with ${WRITE_RECIPE_OPTION}`(
        { nodes: [ theme.emphasis ] },
      ),
      requiresArg: true,
      demandOption: false,
      conflicts: [ 'preparations' ],
      async coerce (filePath: string) {
        if (!filePath) { return undefined; }

        if (!(await exists(filePath))) {
          throw Error(stoyle`Could not find the recipe`({ nodes: [ theme.error ] }));
        }

        return Deno.readTextFile(filePath);
      },
    })
    .option(WRITE_RECIPE_OPTION, {
      alias: 'w',
      type: 'string',
      describe: stoyle`Write the recipe to the given path to reproduce it with ${USE_RECIPE_OPTION} later. Mutually exclusive with ${WRITE_RECIPE_OPTION}`(
        { nodes: [ theme.emphasis, theme.emphasis ] },
      ),
      requiresArg: true,
      demandOption: false,
      conflicts: [ USE_RECIPE_OPTION ],
      async coerce (filePath: string) {
        if (!filePath) { return undefined; }

        if (await exists(filePath) && (await Deno.stat(filePath)).isDirectory) {
          throw Error(stoyle`Cannot write the recipe, ${filePath} is a directory`({ nodes: [ theme.emphasis ] }));
        }

        return filePath;
      },
    })
    .help()
    .wrap(null)
    .parse(Deno.args) as RawCliOptions;

  const options: CliOptions = {
    source: rawOptions.source,
    outputPath: rawOptions.output,
    recipe: rawOptions.useRecipe ? JSON.parse(rawOptions.useRecipe) : undefined,
    recipeOutputPath: rawOptions.writeRecipe,
  };

  await cook(options)
    .catch((error) => console.error(stoyleGlobal`Error while cooking:\n${error.stack}`(theme.error)));
}
