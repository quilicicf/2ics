import enquirer from 'enquirer';
import parse from 'csv-parse/lib/sync.js';
import { Ingester, IngestionResult } from './ingester.js';

const { prompt } = enquirer;

export interface CsvIngesterOptions {
  delimiter: ',' | ';' | '|' | '\t';
}

export const csvIngester: Ingester<CsvIngesterOptions> = {
  id: 'CSV',
  async init (initialOptions: Partial<CsvIngesterOptions>): Promise<CsvIngesterOptions> {
    const acceptedValues = [ ',', ';', '|', '\t' ];
    const optionsUpdater: CsvIngesterOptions = await prompt([
      {
        type: 'input',
        name: 'delimiter',
        skip: !!initialOptions.delimiter,
        message: `Please provide the delimiter, accepted values: ${JSON.stringify(acceptedValues)}`,
        validate (value: string): boolean | string {
          const isValid = acceptedValues.includes(value);
          return isValid ? true : `The delimiter can only be one of: ${JSON.stringify(acceptedValues)}`;
        },
      },
    ]);

    return { ...initialOptions, ...optionsUpdater };
  },
  async ingest (source: string, options: CsvIngesterOptions): Promise<IngestionResult> {
    const records: Record<string, any>[] = parse(source, {
      delimiter: options.delimiter,

      bom: true,

      columns: true,
      columns_duplicates_to_array: true,

      ignore_last_delimiters: true,

      skip_empty_lines: true,
    });

    const fields = Object.keys(records[ 0 ]);
    process.stdout.write(`Found fields:\n  * ${fields.join('\n  * ')}\n`);
    return { fields, records };
  },
};
