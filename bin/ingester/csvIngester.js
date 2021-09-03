import enquirer from 'enquirer';
import parse from 'csv-parse/lib/sync.js';
const { prompt } = enquirer;
export const csvIngester = {
    id: 'CSV',
    async init(initialOptions) {
        const acceptedValues = [',', ';', '|', '\t'];
        const optionsUpdater = await prompt([
            {
                type: 'input',
                name: 'delimiter',
                skip: !!initialOptions.delimiter,
                message: `Please provide the delimiter, accepted values: ${JSON.stringify(acceptedValues)}`,
                validate(value) {
                    const isValid = acceptedValues.includes(value);
                    return isValid ? true : `The delimiter can only be one of: ${JSON.stringify(acceptedValues)}`;
                },
            },
        ]);
        return { ...initialOptions, ...optionsUpdater };
    },
    async ingest(source, options) {
        const records = parse(source, {
            delimiter: options.delimiter,
            bom: true,
            columns: true,
            columns_duplicates_to_array: true,
            ignore_last_delimiters: true,
            skip_empty_lines: true,
        });
        const fields = Object.keys(records[0]);
        process.stdout.write(`Found fields:\n  * ${fields.join('\n  * ')}\n`);
        return { fields, records };
    },
};
