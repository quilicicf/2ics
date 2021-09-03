import yargs from 'yargs';
import chalk from 'chalk';
import { existsSync, readFileSync, statSync } from 'fs';
import { ALL_INGESTERS } from './ingester/ingester.js';
import { cook } from './cook.js';
const { red } = chalk;
const [, bin, ...args] = process.argv;
const USE_RECIPE_OPTION = 'use-recipe';
// @ts-ignore TODO: can it be done better with Yargs API?
const rawOptions = yargs(args)
    .usage(`${bin} --ingester CSV --preparations FIELD_COMPOSITION --output /tmp/output.ics /tmp/input.csv`)
    .option('ingester', {
    alias: 'i',
    type: 'string',
    description: 'The ingester that will read the source file and generate JS objects',
    choices: Object.keys(ALL_INGESTERS),
    requiresArg: true,
    demandOption: true,
})
    .option('output', {
    alias: 'o',
    type: 'string',
    description: 'The output file',
    requiresArg: true,
    demandOption: true,
    coerce(filePath) {
        if (existsSync(filePath) && statSync(filePath).isDirectory()) {
            throw Error(red(`The output path leads to a folder, should be a file`));
        }
        return filePath;
    },
})
    .option('source', {
    alias: 's',
    type: 'string',
    description: 'The source file',
    requiresArg: true,
    demandOption: true,
    coerce(filePath) {
        if (!existsSync(filePath)) {
            throw Error(red(`The source file was not found`));
        }
        return readFileSync(filePath, 'utf8');
    },
})
    .option(USE_RECIPE_OPTION, {
    alias: 'r',
    type: 'string',
    description: 'The path to a recipe',
    requiresArg: true,
    demandOption: false,
    conflicts: 'preparations',
    coerce(filePath) {
        if (!filePath) {
            return undefined;
        }
        if (!existsSync(filePath)) {
            throw Error(red(`Could not find the recipe`));
        }
        return readFileSync(filePath, 'utf8');
    },
})
    .option('write-recipe', {
    alias: 'w',
    type: 'string',
    description: `Write the recipe to the given path to reproduce it with --${USE_RECIPE_OPTION} later`,
    requiresArg: true,
    demandOption: false,
    conflicts: USE_RECIPE_OPTION,
    coerce(filePath) {
        if (!filePath) {
            return undefined;
        }
        if (existsSync(filePath) && statSync(filePath).isDirectory()) {
            throw Error(red(`Cannot write the recipe, ${filePath} is a directory`));
        }
        return filePath;
    },
})
    .help()
    .argv;
const options = {
    source: rawOptions.source,
    outputPath: rawOptions.output,
    ingester: ALL_INGESTERS[rawOptions.ingester],
    recipe: rawOptions.useRecipe ? JSON.parse(rawOptions.useRecipe) : undefined,
    recipeOutputPath: rawOptions.writeRecipe,
};
cook(options)
    .catch(error => process.stderr.write(`Error while cooking:\n${error.stack}\n`));
