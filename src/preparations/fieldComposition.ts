import { Preparation, PreparationInitResult } from './preparation.ts';
import { promptString } from '../dependencies/cliffy.ts';

export interface FieldCompositionOptions {
  composedFieldName: string;
  pattern: string;
}

function resolvePattern (record: Record<string, any>, pattern: string): string {
  return Object.keys(record)
    .reduce(
      (currentValue: string, key: string) => currentValue.replaceAll(`%{${key}}`, record[ key ]),
      pattern,
    );
}

async function promptComposedFieldName (fields: string[]): Promise<string> {
  return await promptString({
    message: 'Please provide the name of the future composed field',
    validate (value: string): boolean | string {
      return fields.includes(value)
        ? `The composed field cannot be part of the existing fields: ${fields.join(', ')}`
        : true;
    },
  });
}

async function promptPattern (): Promise<string> {
  return await promptString({
    message: 'Please provide the pattern. Use record fields like this: %{fieldName}',
  });
}

export const fieldCompositionPreparation: Preparation<FieldCompositionOptions> = {
  id: 'COMPOSITION',
  displayName: 'Compose a new field from other fields',
  startMessage: 'Cooking preparation: field composition',
  serializeOptions (options: FieldCompositionOptions): Record<string, any> {
    return options;
  },
  deserializeOptions (options: Record<string, any>): FieldCompositionOptions {
    return options as FieldCompositionOptions;
  },
  async init (initialOptions: Partial<FieldCompositionOptions>, fields: string[])
    : Promise<PreparationInitResult<FieldCompositionOptions>> {

    const composedFieldName: string = initialOptions.composedFieldName || await promptComposedFieldName(fields);
    const pattern: string = initialOptions.pattern || await promptPattern();

    return {
      fields: [ ...fields, composedFieldName ],
      options: { composedFieldName, pattern },
    };
  },
  cook (records: Record<string, any>[], options: FieldCompositionOptions): Record<string, any>[] {
    return records.map((record) => ({
      ...record,
      [ options.composedFieldName ]: resolvePattern(record, options.pattern),
    }));
  },
};
