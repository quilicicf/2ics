import enquirer from 'enquirer';
const { prompt } = enquirer;
function resolvePattern(record, pattern) {
    return Object.keys(record)
        .reduce((currentValue, key) => {
        return currentValue.replaceAll(`%{${key}}`, record[key]);
    }, pattern);
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
        const optionsUpdater = await prompt([
            {
                type: 'input',
                name: 'composedFieldName',
                skip: !!initialOptions.composedFieldName,
                message: 'Please provide the name of the future composed field',
                validate(value) {
                    return fields.includes(value)
                        ? `The composed field cannot be part of the existing fields: ${fields.join(', ')}`
                        : true;
                },
            },
            {
                type: 'input',
                name: 'pattern',
                skip: !!initialOptions.pattern,
                message: 'Please provide the pattern. Use record fields like this: %{fieldName}',
            },
        ]);
        const newOptions = { ...initialOptions, ...optionsUpdater };
        return {
            fields: [...fields, newOptions.composedFieldName],
            options: newOptions,
        };
    },
    cook(records, options) {
        return records.map(record => ({
            ...record,
            [options.composedFieldName]: resolvePattern(record, options.pattern),
        }));
    },
};
