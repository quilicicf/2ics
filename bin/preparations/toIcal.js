import enquirer from 'enquirer';
const { prompt } = enquirer;
const SKIP_VALUE = 'SKIP_THIS_FIELD';
function mapToIcal(record, options) {
    return {
        summary: record[options.summary],
        dtstart: record[options.dtstart],
        dtend: record[options.dtend],
        location: options.location ? record[options.location] : undefined,
        description: options.description ? record[options.description] : undefined,
    };
}
async function promptField(fieldName, choices) {
    // @ts-ignore
    const { result } = await prompt({
        type: 'select',
        name: 'result',
        message: `In which field is the ${fieldName} of the event?`,
        choices,
    });
    return result;
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
            { name: 'Skip this field', value: SKIP_VALUE },
            ...mandatoryFieldChoices,
        ];
        const summary = initialOptions.summary || await promptField('summary', mandatoryFieldChoices);
        const dtstart = initialOptions.dtstart || await promptField('dtstart', mandatoryFieldChoices);
        const dtend = initialOptions.dtend || await promptField('dtend', mandatoryFieldChoices);
        const location = initialOptions.location || await promptField('location', optionalFieldChoices);
        const description = initialOptions.description || await promptField('description', optionalFieldChoices);
        return { fields, options: { summary, dtstart, dtend, location, description } };
    },
    cook(records, options) {
        return records.map(record => mapToIcal(record, options));
    },
};
