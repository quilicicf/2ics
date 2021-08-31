import yargs from 'yargs';
import chalk from 'chalk';
import { existsSync, readFileSync, statSync } from 'fs';
import { ffvbRecipe } from './recipes/ffvb.js';
const { red } = chalk;
const ALL_RECIPES = {
    [ffvbRecipe.id]: ffvbRecipe,
};
const [, bin, ...args] = process.argv;
yargs(args)
    .usage(`${bin} --input /tmp/source.csv --recipe ffvb`)
    .option('input', {
    alias: 'i',
    type: 'string',
    description: 'The input file',
    requiresArg: true,
    demandOption: true,
    coerce(filePath) {
        if (!existsSync(filePath)) {
            throw Error(red(`The input file was not found`));
        }
        return readFileSync(filePath, 'utf8');
    },
})
    .option('recipe', {
    alias: 'r',
    type: 'string',
    description: 'The recipe to cook',
    choices: Object.keys(ALL_RECIPES),
    requiresArg: true,
    demandOption: true,
    // coerce (recipeId: string): Recipe {
    //   return ALL_RECIPES[ recipeId ];
    // },
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
    .help()
    .argv;
