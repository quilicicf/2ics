import { tmpdir } from 'os';
import { resolve } from 'path';
import enquirer from 'enquirer';
import { rmSync, writeFileSync } from 'fs';

import { Recipe, RecipeElementConfiguration } from './recipe.js';
import { jsToIcs } from './jsToIcs.js';
import { toIcalPreparation } from './preparations/toIcal.js';
import { ALL_INGESTERS, Ingester, IngestionResult } from './ingester/ingester.js';
import { ALL_PREPARATIONS, Preparation, PreparationInitResult } from './preparations/preparation.js';
import { csvIngester, CsvIngesterOptions } from './ingester/csvIngester.js';

const { prompt } = enquirer;

const TEMPORARY_DINER = resolve(tmpdir(), 'temp_diner.json');

export interface CliOptions {
  source: string;
  outputPath: string;

  recipe?: Recipe;
  recipeOutputPath?: string;
}

interface Diner {
  fields: string[];
  records: Record<string, any>[];
  recipe: Recipe;
}

interface Accu {
  preparations: Preparation<any>[],
  options: any[]
}

interface Choice {
  name: string;
  message?: string,
  value?: string;
}

const DONE: string = 'DONE';

const STOP_CHOICE = {
  name: DONE,
  message: `I'm done, let's map that to ical`,
};

const PREPARATION_CHOICES: Choice[] = [
  STOP_CHOICE,
  ...Object.values(ALL_PREPARATIONS)
    .map((preparation: Preparation<any>) => ({
      name: preparation.id,
      message: preparation.displayName,
    })),
];

async function cookPreparation (diner: Diner, preparation: Preparation<any>, initialOptions: any = {}): Promise<Diner> {
  const { fields: newFields, options: preparationOptions }: PreparationInitResult<any>
    = await preparation.init(initialOptions, diner.fields);
  const newRecords = preparation.cook(diner.records, preparationOptions);
  return {
    fields: newFields,
    records: newRecords,
    recipe: {
      ingester: diner.recipe.ingester,
      preparations: [
        ...diner.recipe.preparations,
        { id: preparation.id, options: preparation.serializeOptions(preparationOptions) },
      ],
    },
  };
}

async function cookRecursive (diner: Diner): Promise<Diner> {
  // @ts-ignore
  const { next } = await prompt({
    type: 'autocomplete',
    name: 'next',
    message: 'Choose your next preparation',
    choices: PREPARATION_CHOICES,
  });

  if (!ALL_PREPARATIONS[ next ]) {
    return await cookPreparation(diner, toIcalPreparation);

  } else {
    const upgradedDiner: Diner = await cookPreparation(diner, ALL_PREPARATIONS[ next ]);
    writeFileSync(TEMPORARY_DINER, JSON.stringify(upgradedDiner.records, null, 2), 'utf8');
    return await cookRecursive(upgradedDiner);
  }
}

async function cookUnprepared (source: string): Promise<Diner> {
  process.stdout.write(`I'll help you cook your source file\n`);
  process.stdout.write(`Choose preparations to update your source and have at least the following fields:\n`);
  process.stdout.write(`* the summary of your event (what will appear in the calendar)\n`);
  process.stdout.write(`* the parsed date (there's a preparation for parsing) for the event start\n`);
  process.stdout.write(`* the parsed date for the event end\n`);
  process.stdout.write(`Then finish preparing and I'll help you map your fields to Ical fields at the end\n\n`);
  process.stdout.write(`The state of your diner will be updated after each preparation in file: ${TEMPORARY_DINER}\n`);

  const ingester: Ingester<CsvIngesterOptions> = csvIngester;
  const ingesterOptions: CsvIngesterOptions = await ingester.init({}); // TODO: implement other ingesters and prompt user
  const ingestionResult = await ingester.ingest(source, ingesterOptions);

  writeFileSync(TEMPORARY_DINER, JSON.stringify(ingestionResult.records, null, 2), 'utf8');

  const diner = await cookRecursive({
    fields: ingestionResult.fields,
    records: ingestionResult.records,
    recipe: {
      ingester: {
        id: csvIngester.id,
        options: ingesterOptions,
      },
      preparations: [],
    },
  });

  rmSync(TEMPORARY_DINER);

  return diner;
}

async function cookRecipe (source: string, recipe: Recipe): Promise<Diner> {
  const accu: Accu = recipe.preparations
    .reduce(
      (seed, preparationConfiguration: RecipeElementConfiguration) => {
        const { id, options } = preparationConfiguration;
        const preparation = ALL_PREPARATIONS[ id ];
        return {
          preparations: [ ...seed.preparations, preparation ],
          options: [ ...seed.options, preparation.deserializeOptions(options) ],
        };
      },
      { preparations: [], options: [] } as Accu,
    );

  return cookPreparations(source, recipe, accu.preparations, accu.options);
}

async function cookPreparations (source: string,
                                 recipe: Recipe,
                                 preparations: Preparation<any>[],
                                 preparationsOptions: any[] = []): Promise<Diner> {

  const ingester: Ingester<any> = ALL_INGESTERS[ recipe.ingester.id ];
  const ingesterOptions = recipe.ingester.options || await ingester.init({});
  // @ts-ignore
  const ingestionResult: IngestionResult = await ingester.ingest(source, ingesterOptions);

  return preparations
    .reduce(
      (promise: Promise<Diner>, preparation: Preparation<any>, index: number) => promise
        .then(async (currentDiner: Diner) => {
          const initialOptions: any = preparationsOptions.length > index ? preparationsOptions[ index ] : {};
          return await cookPreparation(currentDiner, preparation, initialOptions);
        }),
      Promise.resolve({ ...ingestionResult, recipe } as Diner),
    );
}

export async function cook (options: CliOptions): Promise<void> {
  const { source, outputPath, recipe, recipeOutputPath } = options;

  const result: Diner = !!recipe
    ? await cookRecipe(source, recipe || [])
    : await cookUnprepared(source);

  const icalendar: string = jsToIcs(result.records);

  writeFileSync(outputPath, icalendar, 'utf8');

  if (recipeOutputPath) {
    writeFileSync(recipeOutputPath, JSON.stringify(result.recipe, null, 2), 'utf8');
  }
}
