import { promptString } from '../dependencies/cliffy.ts';
import { parseCsv } from '../dependencies/csv.ts';

import { Ingester, IngestionResult } from './ingester.ts';

type Delimiter = ','
  | ';'
  | '|'
  | '\t';

export interface CsvIngesterOptions {
  delimiter: Delimiter;
}

async function promptDelimiter (acceptedValues: string[]): Promise<Delimiter> {
  return await promptString({
    message: `Please provide the delimiter, accepted values: ${JSON.stringify(acceptedValues)}`,
    maxLength: 1,
    validate (value: string): boolean | string {
      return acceptedValues.includes(value)
        ? true
        : `The delimiter can only be one of: ${JSON.stringify(acceptedValues)}`;
    },
  }) as Delimiter;
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
  ingest (source: string, options: CsvIngesterOptions): Promise<IngestionResult> {
    const records: Record<string, any>[] = parseCsv(source, {
      delimiter: options.delimiter,

      bom: true,

      columns: true,
      columns_duplicates_to_array: true,

      ignore_last_delimiters: true,

      skip_empty_lines: true,
    });

    const fields = Object.keys(records[ 0 ]);
    console.log(`Found fields:\n  * ${fields.join('\n  * ')}`);
    return Promise.resolve({ fields, records });
  },
};
