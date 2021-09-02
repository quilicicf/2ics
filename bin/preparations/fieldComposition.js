import enquirer from 'enquirer';
const { prompt } = enquirer;
function resolvePattern(record, pattern) {
    return Object.keys(record)
        .reduce((currentValue, key) => {
        return currentValue.replaceAll(`%{${key}}`, record[key]);
    }, pattern);
}
async function promptComposedFieldName(fields) {
    // @ts-ignore
    const { composedFieldName } = await prompt({
        type: 'input',
        name: 'composedFieldName',
        message: 'Please provide the name of the future composed field',
        validate(value) {
            return fields.includes(value)
                ? `The composed field cannot be part of the existing fields: ${fields.join(', ')}`
                : true;
        },
    });
    return composedFieldName;
}
async function promptPattern() {
    // @ts-ignore
    const { pattern } = await prompt({
        type: 'input',
        name: 'pattern',
        message: 'Please provide the pattern. Use record fields like this: %{fieldName}',
    });
    return pattern;
}
export const fieldCompositionPreparation = {
    id: 'COMPOSITION',
    displayName: 'Compose a new field from other fields',
    serializeOptions(options) {
        return options;
    },
    deserializeOptions(options) {
        return options;
    },
    async init(initialOptions, fields) {
        const composedFieldName = initialOptions.composedFieldName || await promptComposedFieldName(fields);
        const pattern = initialOptions.pattern || await promptPattern();
        return {
            fields: [...fields, composedFieldName],
            options: { composedFieldName, pattern },
        };
    },
    cook(records, options) {
        return records.map(record => ({
            ...record,
            [options.composedFieldName]: resolvePattern(record, options.pattern),
        }));
    },
};
