import { promptList, promptString } from '../dependencies/cliffy.ts';

import { Preparation, PreparationInitResult } from './preparation.ts';

export interface FilterOptions {
  regex: RegExp;
  fieldsToInspect: string[];
}

async function promptRegex (): Promise<RegExp> {
  const regexAsString = await promptString({
    message: 'Provide the regex to look for',
    validate (value: string) {
      try {
        return !!new RegExp(value);
      } catch (_) {
        return 'Invalid regex';
      }
    },
  });
  return new RegExp(regexAsString);
}

async function promptFields (fields: string[]): Promise<string[]> {
  return await promptList({
    message: 'Which fields should match the regex to validate the filter? (logical OR)',
    suggestions: fields,
    minTags: 1,
    info: true,
  });
}

async function init (initialOptions: Partial<FilterOptions>, fields: string[])
  : Promise<PreparationInitResult<FilterOptions>> {

  const regex = initialOptions.regex || await promptRegex();
  const fieldsToInspect = initialOptions.fieldsToInspect || await promptFields([ ...fields ]);

  return { fields, options: { regex, fieldsToInspect } };
}

function filter (options: FilterOptions, record: Record<string, any>): boolean {
  return options.fieldsToInspect
    .some((field) => options.regex.test(record[ field ]));
}

function serializeOptions (options: FilterOptions): Record<string, any> {
  return {
    regex: options.regex.source,
    fieldsToInspect: options.fieldsToInspect,
  };
}

function deserializeOptions (options: Record<string, any>): FilterOptions {
  return {
    regex: new RegExp(options.regex),
    fieldsToInspect: options.fieldsToInspect,
  } as FilterOptions;
}

export const filterPreparation: Preparation<FilterOptions> = {
  id: 'FILTER',
  displayName: 'Filter records, records that match the filter will be included',
  startMessage: 'Cooking preparation: filter',
  serializeOptions,
  deserializeOptions,
  init,
  cook (records: Record<string, any>[], options: FilterOptions): Record<string, any>[] {
    return records.filter((record) => filter(options, record));
  },
};

export const invertedFilterPreparation: Preparation<FilterOptions> = {
  id: 'INVERTED_FILTER',
  displayName: 'Filter records, records that match the filter will be excluded',
  startMessage: 'Cooking preparation: inverted filter',
  serializeOptions,
  deserializeOptions,
  init,
  cook (records: Record<string, any>[], options: FilterOptions): Record<string, any>[] {
    return records.filter((record) => !filter(options, record));
  },
};
