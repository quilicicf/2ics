import { ALL_PREPARATIONS } from './preparations/preparation.js';
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
        .then(async (currentValue) => {
        const initialOptions = preparationsOptions.length > index ? preparationsOptions[index] : {};
        const { fields: newFields, options: preparationOptions } = await preparation.init(initialOptions, currentValue.fields);
        const newRecords = preparation.cook(currentValue.records, preparationOptions);
        return {
            fields: newFields,
            records: newRecords,
            recipe: [
                ...currentValue.recipe,
                { id: preparation.id, options: preparation.serializeOptions(preparationOptions) },
            ],
        };
    }), Promise.resolve({ ...ingestionResult, recipe: [] }));
}
export async function cook(options) {
    const { source, ingester, outputPath, preparations, recipe } = options;
    const ingesterOptions = await ingester.init({}); // TODO: read options somewhere?
    // @ts-ignore
    const ingestionResult = await ingester.ingest(source, ingesterOptions);
    const result = !!preparations
        ? await cookPreparations(ingestionResult, preparations)
        : await cookRecipe(ingestionResult, recipe || []);
    process.stdout.write(`Final records: ${JSON.stringify(result)}\n`);
}
