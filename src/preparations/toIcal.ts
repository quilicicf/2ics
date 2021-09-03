import enquirer from 'enquirer';
import { Preparation, PreparationInitResult } from './preparation.js';

const { prompt } = enquirer;

const SKIP_VALUE = 'SKIP_THIS_FIELD';

export interface ToIcalOptions {
  summary: string;
  dtstart: string;
  dtend: string;

  location: string;
  description: string;
}

interface Choice {
  name: string;
  value?: string;
}

function mapToIcal (record: Record<string, any>, options: ToIcalOptions): Record<string, any> {
  return {
    summary: record[ options.summary ],
    dtstart: record[ options.dtstart ],
    dtend: record[ options.dtend ],

    location: options.location ? record[ options.location ] : undefined,
    description: options.description ? record[ options.description ] : undefined,
  };
}

async function promptField (fieldName: string, choices: Choice[]): Promise<string> {
  // @ts-ignore
  const { result } = await prompt({
    type: 'autocomplete',
    name: 'result',
    message: `In which field is the ${fieldName} of the event?`,
    choices,
  });

  return result;
}

export const toIcalPreparation: Preparation<ToIcalOptions> = {
  id: 'ICAL',
  displayName: 'Map the fields to the expected ical fields',
  serializeOptions (options: ToIcalOptions): Record<string, any> {
    return options;
  },
  deserializeOptions (options: Record<string, any>): ToIcalOptions {
    return options as ToIcalOptions;
  },
  async init (initialOptions: Partial<ToIcalOptions>, fields: string[]): Promise<PreparationInitResult<ToIcalOptions>> {
    const mandatoryFieldChoices: Choice[] = fields.map(field => ({ name: field, value: field }));
    const optionalFieldChoices: Choice[] = [
      { name: 'Skip this field', value: SKIP_VALUE },
      ...mandatoryFieldChoices,
    ];

    const summary: string = initialOptions.summary || await promptField('summary', mandatoryFieldChoices);
    const dtstart: string = initialOptions.dtstart || await promptField('dtstart', mandatoryFieldChoices);
    const dtend: string = initialOptions.dtend || await promptField('dtend', mandatoryFieldChoices);

    const location: string = initialOptions.location || await promptField('location', optionalFieldChoices);
    const description: string = initialOptions.description || await promptField('description', optionalFieldChoices);

    return { fields, options: { summary, dtstart, dtend, location, description } };
  },
  cook (records: Record<string, any>[], options: ToIcalOptions): Record<string, any>[] {
    return records.map(record => mapToIcal(record, options));
  },
};
