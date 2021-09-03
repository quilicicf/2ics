import enquirer from 'enquirer';
import { addDays, addHours, addMinutes, parse } from 'date-fns';
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

async function promptField (fields: string[]): Promise<string> {
  // @ts-ignore
  const { field } = await prompt({
    type: 'autocomplete',
    name: 'field',
    message: 'Please provide the name of the field with the date inside',
    choices: [ ...fields ],
  });
  return field;
}

async function promptFormat (): Promise<string> {
  // @ts-ignore
  const { format } = await prompt({
    type: 'input',
    name: 'format',
    message: 'Please provide the date format',
  });
  return format;
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
    const field: string = initialOptions.field || await promptField(fields);
    const format: string = initialOptions.format || await promptFormat();

    return { fields, options: { field, format } };
  },
  cook (records: Record<string, any>[], options: ParseDateOptions): Record<string, any>[] {
    return records.map(record => parseDate(record, options));
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
  // @ts-ignore
  const { newField } = await prompt({
    type: 'input',
    name: 'newField',
    message: 'Please provide the name of the field with updated date',
    validate (value: string): boolean | string {
      return fields.includes(value)
        ? `The new field cannot be part of the existing fields: ${fields.join(', ')}`
        : true;
    },
  });
  return newField;
}

async function promptUnit (): Promise<TimeUnit> {
  // @ts-ignore
  const { unit } = await prompt({
    type: 'autocomplete',
    name: 'unit',
    message: 'Please provide the time unit',
    choices: [ 'DAYS', 'HOURS', 'MINUTES' ],
  });
  return unit;
}

async function promptAmount (): Promise<number> {
  // @ts-ignore
  const { amount } = await prompt({
    type: 'numeral',
    name: 'amount',
    message: 'Please provide the time amount',
    required: true,
    validate (input: string): string | boolean {
      if (!/^(-)?[0-9]+$/.test(input)) {
        return 'The amount should be an integer';
      }
      return true;
    },
  });
  return amount;
}

function addTime (date: Date, options: AddTimeOptions): Date {
  switch (options.unit) {
    case 'DAYS':
      return addDays(date, options.amount);
    case 'HOURS':
      return addHours(date, options.amount);
    case 'MINUTES':
      return addMinutes(date, options.amount);
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
  serializeOptions (options: AddTimeOptions): Record<string, any> {
    return options;
  },
  deserializeOptions (options: Record<string, any>): AddTimeOptions {
    return options as AddTimeOptions;
  },
  async init (initialOptions: Partial<AddTimeOptions>, fields: string[]): Promise<PreparationInitResult<AddTimeOptions>> {
    const field: string = initialOptions.field || await promptField(fields);
    const newField: string = initialOptions.newField || await promptNewField(fields);
    const unit: TimeUnit = initialOptions.unit || await promptUnit();
    const amount: number = initialOptions.amount || await promptAmount();

    return {
      fields: [ ...fields, newField ],
      options: { field, newField, unit, amount },
    };
  },
  cook (records: Record<string, any>[], options: AddTimeOptions): Record<string, any>[] {
    return records.map(record => addTimeToRecord(record, options));
  },
};
