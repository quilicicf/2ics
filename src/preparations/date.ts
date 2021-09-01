import enquirer from 'enquirer';
import { parse } from 'date-fns';
import { Preparation, PreparationInitResult } from './preparation.js';

const { prompt } = enquirer;

export interface ParseDateOptions {
  field: string;
  format: string;
}

function parseDate (record: Record<string, any>, options: ParseDateOptions): Record<string, any> {
  const dateAsString: string = record[ options.field ];
  const date = parse(dateAsString, options.format, new Date());
  return {
    ...record,
    [ options.field ]: date,
  };
}

export const parseDatePreparation: Preparation<ParseDateOptions> = {
  id: 'PARSE_DATE',
  displayName: 'Parse the date in a field',
  serializeOptions (options: ParseDateOptions): Record<string, any> {
    return options;
  },
  deserializeOptions (options: Record<string, any>): ParseDateOptions {
    return options as ParseDateOptions;
  },
  async init (initialOptions: Partial<ParseDateOptions>, fields: string[]): Promise<PreparationInitResult<ParseDateOptions>> {
    const optionsUpdater: ParseDateOptions = await prompt([
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
  cook (records: Record<string, any>[], options: ParseDateOptions): Record<string, any>[] {
    return records.map(record => parseDate(record, options));
  },
};
