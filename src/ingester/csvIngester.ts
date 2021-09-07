import enquirer from 'enquirer';
import parse from 'csv-parse/lib/sync.js';
import { Ingester, IngestionResult } from './ingester.js';

const { prompt } = enquirer;

type Delimiter = ','
  | ';'
  | '|'
  | '\t';

export interface CsvIngesterOptions {
  delimiter: Delimiter;
}

async function promptDelimiter (acceptedValues: string[]): Promise<Delimiter> {
  // @ts-ignore
  const { delimiter } = await prompt({
    type: 'input',
    name: 'delimiter',
    message: `Please provide the delimiter, accepted values: ${JSON.stringify(acceptedValues)}`,
    validate (value: string): boolean | string {
      return acceptedValues.includes(value)
        ? true
        : `The delimiter can only be one of: ${JSON.stringify(acceptedValues)}`;
    },
  });
  return delimiter;
}

export const csvIngester: Ingester<CsvIngesterOptions> = {
  id: 'CSV',
  displayName: 'CSV ingester',
  startMessage: 'Ingesting CSV file',
  async init (initialOptions: Partial<CsvIngesterOptions>): Promise<CsvIngesterOptions> {
    const acceptedValues: Delimiter[] = [ ',', ';', '|', '\t' ];
    const delimiter: Delimiter = initialOptions.delimiter || await promptDelimiter(acceptedValues);
    return { delimiter };
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
