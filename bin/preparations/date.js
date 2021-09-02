import enquirer from 'enquirer';
import { addDays, addHours, addMinutes, parse } from 'date-fns';
const { prompt } = enquirer;
function parseDate(record, options) {
    const dateAsString = record[options.field];
    const date = parse(dateAsString, options.format, new Date());
    return {
        ...record,
        [options.field]: date,
    };
}
async function promptField(fields) {
    // @ts-ignore
    const { field } = await prompt({
        type: 'select',
        name: 'field',
        message: 'Please provide the name of the field with the date inside',
        choices: [...fields],
    });
    return field;
}
async function promptFormat() {
    // @ts-ignore
    const { field } = await prompt({
        type: 'input',
        name: 'format',
        message: 'Please provide the date format',
    });
    return field;
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
        const field = initialOptions.field || await promptField(fields);
        const format = initialOptions.format || await promptFormat();
        return { fields, options: { field, format } };
    },
    cook(records, options) {
        return records.map(record => parseDate(record, options));
    },
};
async function promptNewField(fields) {
    // @ts-ignore
    const { newField } = await prompt({
        type: 'input',
        name: 'newField',
        message: 'Please provide the name of the field with updated date',
        validate(value) {
            return fields.includes(value)
                ? `The new field cannot be part of the existing fields: ${fields.join(', ')}`
                : true;
        },
    });
    return newField;
}
async function promptUnit() {
    // @ts-ignore
    const { unit } = await prompt({
        type: 'select',
        name: 'unit',
        message: 'Please provide the time unit',
        choices: ['DAYS', 'HOURS', 'MINUTES'],
    });
    return unit;
}
async function promptAmount() {
    // @ts-ignore
    const { amount } = await prompt({
        type: 'number',
        name: 'amount',
        message: 'Please provide the time amount',
        required: true,
        validate(input) {
            if (!/^(-)?[0-9]+$/.test(input)) {
                return 'The amount should be an integer';
            }
            return true;
        },
    });
    return amount;
}
function addTime(date, options) {
    switch (options.unit) {
        case 'DAYS':
            return addDays(date, options.amount);
        case 'HOURS':
            return addHours(date, options.amount);
        case 'MINUTES':
            return addMinutes(date, options.amount);
    }
}
function addTimeToRecord(record, options) {
    const newDate = addTime(record[options.field], options);
    return {
        ...record,
        [options.newField]: newDate,
    };
}
export const addTimePreparation = {
    id: 'ADD_TIME',
    displayName: 'Add time to a parsed date',
    serializeOptions(options) {
        return options;
    },
    deserializeOptions(options) {
        return options;
    },
    async init(initialOptions, fields) {
        const field = initialOptions.field || await promptField(fields);
        const newField = initialOptions.newField || await promptNewField(fields);
        const unit = initialOptions.unit || await promptUnit();
        const amount = initialOptions.amount || await promptAmount();
        return { fields, options: { field, newField, unit, amount } };
    },
    cook(records, options) {
        return records.map(record => addTimeToRecord(record, options));
    },
};
