import enquirer from 'enquirer';
import { parse } from 'date-fns';
const { prompt } = enquirer;
function parseDate(record, options) {
    const dateAsString = record[options.field];
    const date = parse(dateAsString, options.format, new Date());
    return {
        ...record,
        [options.field]: date,
    };
}
export const parseDatePreparation = {
    id: 'PARSE_DATE',
    displayName: 'Parse the date in a field',
    serializeOptions(options) {
        return options;
    },
    deserializeOptions(options) {
        return options;
    },
    async init(initialOptions, fields) {
        const optionsUpdater = await prompt([
            {
                type: 'select',
                name: 'field',
                skip: !!initialOptions.field,
                message: 'Please provide the name of the field with the date inside',
                choices: fields.map(field => ({ name: field, value: field })),
            },
            {
                type: 'input',
                name: 'format',
                skip: !!initialOptions.format,
                message: 'Please provide the date format',
            },
        ]);
        return { fields, options: { ...initialOptions, ...optionsUpdater } };
    },
    cook(records, options) {
        return records.map(record => parseDate(record, options));
    },
};
