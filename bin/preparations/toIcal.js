import enquirer from 'enquirer';
const { prompt } = enquirer;
const TZ = Intl.DateTimeFormat()
    .resolvedOptions()
    .timeZone;
function mapToIcal(record, options) {
    return {
        summary: record[options.summary],
        dtstart: record[options.dtstart],
        dtend: record[options.dtend],
        location: options.location ? record[options.location] : undefined,
        description: options.description ? record[options.description] : undefined,
        organizer: options.organizer ? record[options.organizer] : undefined,
        attendees: options.attendees ? record[options.attendees] : undefined,
    };
}
export const toIcalPreparation = {
    id: 'ICAL',
    displayName: 'Map the fields to the expected ical fields',
    serializeOptions(options) {
        return options;
    },
    deserializeOptions(options) {
        return options;
    },
    async init(initialOptions, fields) {
        const mandatoryFieldChoices = fields.map(field => ({ name: field, value: field }));
        const optionalFieldChoices = [
            { name: 'Skip this field', value: undefined },
            ...mandatoryFieldChoices,
        ];
        const optionsUpdater = await prompt([
            {
                type: 'select',
                name: 'summary',
                skip: !!initialOptions.summary,
                message: 'In which field is the summary of the event?',
                choices: mandatoryFieldChoices,
            },
            {
                type: 'select',
                name: 'dtstart',
                skip: !!initialOptions.dtstart,
                message: 'In which field is the start date of the event?',
                choices: mandatoryFieldChoices,
            },
            {
                type: 'select',
                name: 'dtend',
                skip: !!initialOptions.dtend,
                message: 'In which field is the end date of the event?',
                choices: mandatoryFieldChoices,
            },
            {
                type: 'select',
                name: 'location',
                skip: !!initialOptions.location,
                message: 'In which field is the location of the event?',
                choices: optionalFieldChoices,
            },
            {
                type: 'select',
                name: 'description',
                skip: !!initialOptions.description,
                message: 'In which field is the description of the event?',
                choices: optionalFieldChoices,
            },
        ]);
        return { fields, options: { ...initialOptions, ...optionsUpdater } };
    },
    cook(records, options) {
        return records.map(record => mapToIcal(record, options));
    },
};
