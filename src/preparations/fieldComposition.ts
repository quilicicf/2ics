import enquirer from 'enquirer';
import { Preparation, PreparationInitResult } from './preparation.js';

const { prompt } = enquirer;

export interface FieldCompositionOptions {
  composedFieldName: string;
  pattern: string;
}

function resolvePattern (record: Record<string, any>, pattern: string): string {
  return Object.keys(record)
    .reduce(
      (currentValue: string, key: string) => {
        return currentValue.replaceAll(`%{${key}}`, record[ key ]);
      },
      pattern,
    );
}

export const fieldCompositionPreparation: Preparation<FieldCompositionOptions> = {
  id: 'COMPOSITION',
  displayName: 'Compose a new field from other fields',
  serializeOptions (options: FieldCompositionOptions): Record<string, any> {
    return options;
  },
  deserializeOptions (options: Record<string, any>): FieldCompositionOptions {
    return options as FieldCompositionOptions;
  },
  async init (initialOptions: Partial<FieldCompositionOptions>, fields: string[]): Promise<PreparationInitResult<FieldCompositionOptions>> {
    const optionsUpdater: FieldCompositionOptions = await prompt([
      {
        type: 'input',
        name: 'composedFieldName',
        skip: !!initialOptions.composedFieldName,
        message: 'Please provide the name of the future composed field',
        validate (value: string): boolean | string {
          return fields.includes(value)
            ? `The composed field cannot be part of the existing fields: ${fields.join(', ')}`
            : true;
        },
      },
      {
        type: 'input',
        name: 'pattern',
        skip: !!initialOptions.pattern,
        message: 'Please provide the pattern. Use record fields like this: %{fieldName}',
      },
    ]);

    const newOptions = { ...initialOptions, ...optionsUpdater };
    return {
      fields: [ ...fields, newOptions.composedFieldName ],
      options: newOptions,
    };
  },
  cook (records: Record<string, any>[], options: FieldCompositionOptions): Record<string, any>[] {
    return records.map(record => ({
      ...record,
      [ options.composedFieldName ]: resolvePattern(record, options.pattern),
    }));
  },
};
