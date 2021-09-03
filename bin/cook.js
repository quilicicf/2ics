import { tmpdir } from 'os';
import { resolve } from 'path';
import enquirer from 'enquirer';
import { rmSync, writeFileSync } from 'fs';
import { jsToIcs } from './jsToIcs.js';
import { ALL_PREPARATIONS } from './preparations/preparation.js';
import { toIcalPreparation } from './preparations/toIcal.js';
const { prompt } = enquirer;
const TEMPORARY_DINER = resolve(tmpdir(), 'temp_diner.json');
const DONE = 'DONE';
const STOP_CHOICE = {
    name: DONE,
    message: `I'm done, let's map that to ical`,
    // value: DONE,
};
const PREPARATION_CHOICES = [
    STOP_CHOICE,
    ...Object.values(ALL_PREPARATIONS)
        .map((preparation) => ({
        message: preparation.displayName,
        name: preparation.id,
    })),
];
async function cookPreparation(diner, preparation, initialOptions = {}) {
    const { fields: newFields, options: preparationOptions } = await preparation.init(initialOptions, diner.fields);
    const newRecords = preparation.cook(diner.records, preparationOptions);
    return {
        fields: newFields,
        records: newRecords,
        recipe: [
            ...diner.recipe,
            { id: preparation.id, options: preparation.serializeOptions(preparationOptions) },
        ],
    };
}
async function cookRecursive(diner) {
    // @ts-ignore
    const { next } = await prompt({
        type: 'autocomplete',
        name: 'next',
        message: 'Choose your next preparation',
        choices: PREPARATION_CHOICES,
    });
    if (!ALL_PREPARATIONS[next]) {
        return await cookPreparation(diner, toIcalPreparation);
    }
    else {
        const upgradedDiner = await cookPreparation(diner, ALL_PREPARATIONS[next]);
        writeFileSync(TEMPORARY_DINER, JSON.stringify(upgradedDiner.records, null, 2), 'utf8');
        return await cookRecursive(upgradedDiner);
    }
}
async function cookUnprepared(ingestionResult) {
    process.stdout.write(`I'll help you cook your source file\n`);
    process.stdout.write(`Choose preparations to update your source and have at least the following fields:\n`);
    process.stdout.write(`* the summary of your event (what will appear in the calendar)\n`);
    process.stdout.write(`* the parsed date (there's a preparation for parsing) for the event start\n`);
    process.stdout.write(`* the parsed date for the event end\n`);
    process.stdout.write(`Then finish preparing and I'll help you map your fields to Ical fields at the end\n\n`);
    process.stdout.write(`The current state of your diner will be updated after each preparation in file: ${TEMPORARY_DINER}\n`);
    writeFileSync(TEMPORARY_DINER, JSON.stringify(ingestionResult.records, null, 2), 'utf8');
    const diner = await cookRecursive({
        fields: ingestionResult.fields,
        records: ingestionResult.records,
        recipe: [],
    });
    rmSync(TEMPORARY_DINER);
    return diner;
}
async function cookRecipe(ingestionResult, recipe) {
    const accu = recipe
        .reduce((seed, preparationConfiguration) => {
        const { id, options } = preparationConfiguration;
        const preparation = ALL_PREPARATIONS[id];
        return {
            preparations: [...seed.preparations, preparation],
            options: [...seed.options, preparation.deserializeOptions(options)],
        };
    }, { preparations: [], options: [] });
    return cookPreparations(ingestionResult, accu.preparations, accu.options);
}
async function cookPreparations(ingestionResult, preparations, preparationsOptions = []) {
    return preparations
        .reduce((promise, preparation, index) => promise
        .then(async (currentDiner) => {
        const initialOptions = preparationsOptions.length > index ? preparationsOptions[index] : {};
        return await cookPreparation(currentDiner, preparation, initialOptions);
    }), Promise.resolve({ ...ingestionResult, recipe: [] }));
}
export async function cook(options) {
    const { source, ingester, outputPath, recipe, recipeOutputPath } = options;
    const ingesterOptions = await ingester.init({}); // TODO: read options somewhere?
    // @ts-ignore
    const ingestionResult = await ingester.ingest(source, ingesterOptions);
    const result = !!recipe
        ? await cookRecipe(ingestionResult, recipe || [])
        : await cookUnprepared(ingestionResult);
    const icalendar = jsToIcs(result.records);
    writeFileSync(outputPath, icalendar, 'utf8');
    if (recipeOutputPath) {
        writeFileSync(recipeOutputPath, JSON.stringify(result.recipe, null, 2), 'utf8');
    }
}
