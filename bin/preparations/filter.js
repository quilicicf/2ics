import enquirer from 'enquirer';
const { prompt } = enquirer;
async function promptRegex() {
    // @ts-ignore
    const { regex: regexAsString } = await prompt({
        type: 'input',
        name: 'regex',
        message: 'Provide the regex to look for',
        validate(value) {
            try {
                new RegExp(value);
                return true;
            }
            catch (error) {
                return 'Invalid regex';
            }
        },
    });
    return new RegExp(regexAsString);
}
async function promptFields(fields) {
    // @ts-ignore
    const { fieldsToInspect } = await prompt({
        type: 'multiselect',
        name: 'fieldsToInspect',
        message: 'Which fields should match the regex to validate the filter? (logical OR)',
        choices: fields,
    });
    return fieldsToInspect;
}
async function init(initialOptions, fields) {
    const regex = initialOptions.regex || await promptRegex();
    const fieldsToInspect = initialOptions.fieldsToInspect || await promptFields([...fields]);
    return { fields, options: { regex, fieldsToInspect } };
}
function filter(options, record) {
    return options.fieldsToInspect
        .some(field => options.regex.test(record[field]));
}
function serializeOptions(options) {
    return {
        regex: options.regex.source,
        fieldsToInspect: options.fieldsToInspect,
    };
}
function deserializeOptions(options) {
    return {
        regex: new RegExp(options.regex),
        fieldsToInspect: options.fieldsToInspect,
    };
}
export const filterPreparation = {
    id: 'FILTER',
    displayName: 'Filter records, records that match the filter will be included',
    serializeOptions,
    deserializeOptions,
    init,
    cook(records, options) {
        return records.filter(record => filter(options, record));
    },
};
export const invertedFilterPreparation = {
    id: 'INVERTED_FILTER',
    displayName: 'Filter records, records that match the filter will be excluded',
    serializeOptions,
    deserializeOptions,
    init,
    cook(records, options) {
        return records.filter(record => !filter(options, record));
    },
};
