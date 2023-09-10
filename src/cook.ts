import { stoyleGlobal, theme } from './dependencies/stoyle.ts';
import { promptSelect } from './dependencies/cliffy.ts';

import { Recipe, RecipeElementConfiguration } from './recipe.ts';
import jsToIcs from './jsToIcs.ts';
import { toIcalPreparation } from './preparations/toIcal.ts';
import { ALL_INGESTERS, Ingester, IngestionResult } from './ingester/ingester.ts';
import { ALL_PREPARATIONS, Preparation, PreparationInitResult } from './preparations/preparation.ts';
import { csvIngester } from './ingester/csvIngester.ts';

const TEMPORARY_DINER = await Deno.makeTempFile();

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
  value: string;
  name?: string,
}

const DONE = 'DONE';

const STOP_CHOICE = {
  value: DONE,
  name: 'I\'m done, let\'s map that to ical',
};

const PREPARATION_CHOICES: Choice[] = [
  STOP_CHOICE,
  ...Object.values(ALL_PREPARATIONS)
    .map((preparation: Preparation<any>) => ({
      value: preparation.id,
      name: preparation.displayName,
    })),
];

async function cookPreparation (diner: Diner, preparation: Preparation<any>, initialOptions: any = {}): Promise<Diner> {
  const {
    fields: newFields,
    options: preparationOptions,
  }: PreparationInitResult<any> = await preparation.init(initialOptions, diner.fields);
  console.log(stoyleGlobal`${preparation.startMessage}`(theme.status));
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
  const next = await promptSelect({
    message: 'Choose your next preparation',
    options: PREPARATION_CHOICES,
    maxRows: 10,
    search: true,
  });

  if (!ALL_PREPARATIONS[ next ]) {
    return cookPreparation(diner, toIcalPreparation);

  }

  const upgradedDiner: Diner = await cookPreparation(diner, ALL_PREPARATIONS[ next ]);
  await Deno.writeTextFile(TEMPORARY_DINER, JSON.stringify(upgradedDiner.records, null, 2));
  return cookRecursive(upgradedDiner);
}

async function promptIngester (): Promise<Ingester<any>> {
  const ingesterId = await promptSelect({
    message: 'Choose the ingester',
    options: Object.values(ALL_INGESTERS)
      .map(({ id, displayName }) => ({ value: id, name: displayName })),
    maxRows: 10,
    search: true,
  });

  return ALL_INGESTERS[ ingesterId ];
}

async function cookUnprepared (source: string): Promise<Diner> {
  console.log('I\'ll help you cook your source file');
  console.log('Choose preparations to update your source and have at least the following fields:');
  console.log('* the summary of your event (what will appear in the calendar)');
  console.log('* the parsed date (there\'s a preparation for parsing) for the event start');
  console.log('* the parsed date for the event end');
  console.log('Then finish preparing and I\'ll help you map your fields to Ical fields at the end\n');
  console.log(`The state of your diner will be updated after each preparation in file: ${TEMPORARY_DINER}`);

  const ingester: Ingester<any> = await promptIngester();
  const ingesterOptions: any = await ingester.init({});
  console.log(stoyleGlobal`${ingester.startMessage}`(theme.status));
  const ingestionResult = await ingester.ingest(source, ingesterOptions);

  await Deno.writeTextFile(TEMPORARY_DINER, JSON.stringify(ingestionResult.records, null, 2));

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

  await Deno.remove(TEMPORARY_DINER);

  return diner;
}

async function cookPreparations (source: string, recipe: Recipe, preparations: Preparation<any>[], preparationsOptions: any[] = []): Promise<Diner> {

  const ingester: Ingester<any> = ALL_INGESTERS[ recipe.ingester.id ];
  const ingesterOptions = recipe.ingester.options || await ingester.init({});
  console.log(stoyleGlobal`${ingester.startMessage}`(theme.status));
  const ingestionResult: IngestionResult = await ingester.ingest(source, ingesterOptions);

  return preparations
    .reduce(
      (promise: Promise<Diner>, preparation: Preparation<any>, index: number) => promise
        .then((currentDiner: Diner) => {
          const initialOptions: any = preparationsOptions.length > index ? preparationsOptions[ index ] : {};
          return cookPreparation(currentDiner, preparation, initialOptions);
        }),
      Promise.resolve({ ...ingestionResult, recipe } as Diner),
    );
}

function cookRecipe (source: string, recipe: Recipe): Promise<Diner> {
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

export async function cook (options: CliOptions): Promise<void> {
  const {
    source, outputPath, recipe, recipeOutputPath,
  } = options;

  const result: Diner = recipe
    ? await cookRecipe(source, recipe || [])
    : await cookUnprepared(source);

  const icalendar: string = jsToIcs(result.records);

  await Deno.writeTextFile(outputPath, icalendar);

  if (recipeOutputPath) {
    await Deno.writeTextFile(recipeOutputPath, JSON.stringify(result.recipe, null, 2));
  }
}
