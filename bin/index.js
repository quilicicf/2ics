import yargs from 'yargs';
import chalk from 'chalk';
import { existsSync, readFileSync, statSync } from 'fs';
import { ALL_INGESTERS } from './ingester/ingester.js';
import { ALL_PREPARATIONS } from './preparations/preparation.js';
import { cook } from './cook.js';
const { red } = chalk;
const [, bin, ...args] = process.argv;
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
    .option('preparations', {
    alias: 'p',
    type: 'string',
    array: true,
    description: 'The preparations to run',
    choices: Object.keys(ALL_PREPARATIONS),
    requiresArg: true,
    demandOption: false,
})
    .option('recipe', {
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
    .help()
    .argv;
const options = {
    source: rawOptions.source,
    outputPath: rawOptions.output,
    ingester: ALL_INGESTERS[rawOptions.ingester],
    preparations: rawOptions.preparations
        ? rawOptions.preparations.map(id => ALL_PREPARATIONS[id])
        : undefined,
    recipe: rawOptions.recipe ? JSON.parse(rawOptions.recipe) : undefined,
};
cook(options)
    .catch(error => process.stderr.write(`Error while cooking:\n${error.stack}\n`));
