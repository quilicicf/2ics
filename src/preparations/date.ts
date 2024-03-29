import { addDays, addHours, addMinutes, parse } from '../dependencies/datefns.ts';
import { promptNumber, promptSelect, promptString } from '../dependencies/cliffy.ts';

import { Preparation, PreparationInitResult } from './preparation.ts';

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

async function promptField (fields: string[]): Promise<string> {
  return await promptSelect({
    message: 'Please provide the name of the field with the date inside',
    options: [ ...fields ],
    maxRows: 10,
    search: true,
  });
}

async function promptFormat (): Promise<string> {
  return await promptString({
    message: 'Please provide the date format',
  });
}

export const parseDatePreparation: Preparation<ParseDateOptions> = {
  id: 'PARSE_DATE',
  displayName: 'Parse the date in a field',
  startMessage: 'Cooking preparation: parse date',
  serializeOptions (options: ParseDateOptions): Record<string, any> {
    return options;
  },
  deserializeOptions (options: Record<string, any>): ParseDateOptions {
    return options as ParseDateOptions;
  },
  async init (initialOptions: Partial<ParseDateOptions>, fields: string[])
    : Promise<PreparationInitResult<ParseDateOptions>> {

    const field: string = initialOptions.field || await promptField(fields);
    const format: string = initialOptions.format || await promptFormat();

    return { fields, options: { field, format } };
  },
  cook (records: Record<string, any>[], options: ParseDateOptions): Record<string, any>[] {
    return records.map((record) => parseDate(record, options));
  },
};

type TimeUnit = 'DAYS' | 'HOURS' | 'MINUTES';

export interface AddTimeOptions {
  unit: TimeUnit;
  amount: number;
  field: string;
  newField: string;
}

async function promptNewField (fields: string[]): Promise<string> {
  return await promptString({
    message: 'Please provide the name of the field with updated date',
    validate (value: string): boolean | string {
      return fields.includes(value)
        ? `The new field cannot be part of the existing fields: ${fields.join(', ')}`
        : true;
    },
  });
}

async function promptUnit (): Promise<TimeUnit> {
  return await promptSelect({
    message: 'Please provide the time unit',
    options: [ 'DAYS', 'HOURS', 'MINUTES' ],
    maxRows: 10,
    search: true,
  });
}

async function promptAmount (): Promise<number> {
  return await promptNumber({
    message: 'Please provide the time amount',
    required: true,
    validate (input: string): string | boolean {
      if (!/^(-)?[0-9]+$/.test(input)) {
        return 'The amount should be an integer';
      }
      return true;
    },
  });
}

function addTime (date: Date, options: AddTimeOptions): Date {
  switch (options.unit) {
    case 'DAYS':
      return addDays(date, options.amount);
    case 'HOURS':
      return addHours(date, options.amount);
    case 'MINUTES':
      return addMinutes(date, options.amount);
    default:
      throw Error(`No such time unit ${options.unit}`);
  }
}

function addTimeToRecord (record: Record<string, any>, options: AddTimeOptions): Record<string, any> {
  const newDate: Date = addTime(record[ options.field ], options);
  return {
    ...record,
    [ options.newField ]: newDate,
  };
}

export const addTimePreparation: Preparation<AddTimeOptions> = {
  id: 'ADD_TIME',
  displayName: 'Add time to a parsed date',
  startMessage: 'Cooking preparation: add time to parsed date',
  serializeOptions (options: AddTimeOptions): Record<string, any> {
    return options;
  },
  deserializeOptions (options: Record<string, any>): AddTimeOptions {
    return options as AddTimeOptions;
  },
  async init (initialOptions: Partial<AddTimeOptions>, fields: string[])
    : Promise<PreparationInitResult<AddTimeOptions>> {

    const field: string = initialOptions.field || await promptField(fields);
    const newField: string = initialOptions.newField || await promptNewField(fields);
    const unit: TimeUnit = initialOptions.unit || await promptUnit();
    const amount: number = initialOptions.amount || await promptAmount();

    return {
      fields: [ ...fields, newField ],
      options: {
        field, newField, unit, amount,
      },
    };
  },
  cook (records: Record<string, any>[], options: AddTimeOptions): Record<string, any>[] {
    return records.map((record) => addTimeToRecord(record, options));
  },
};
