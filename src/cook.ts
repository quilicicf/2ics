import { Ingester, IngestionResult } from './ingester/ingester.js';
import { ALL_PREPARATIONS, Preparation, PreparationInitResult } from './preparations/preparation.js';

interface PreparationConfiguration {
  id: string;
  options: object;
}

export interface CliOptions {
  source: string;
  ingester: Ingester<any>;
  outputPath: string;
  preparations?: Preparation<any>[];
  recipe?: PreparationConfiguration[];
}

interface Diner {
  fields: string[];
  records: Record<string, any>[];
  recipe: PreparationConfiguration[];
}

interface Accu {
  preparations: Preparation<any>[],
  options: any[]
}

async function cookRecipe (ingestionResult: IngestionResult, recipe: PreparationConfiguration[]): Promise<Diner> {
  const accu: Accu = recipe
    .reduce(
      (seed, preparationConfiguration: PreparationConfiguration) => {
        const { id, options } = preparationConfiguration;
        const preparation = ALL_PREPARATIONS[ id ];
        return {
          preparations: [ ...seed.preparations, preparation ],
          options: [ ...seed.options, preparation.deserializeOptions(options) ],
        };
      },
      { preparations: [], options: [] } as Accu,
    );

  return cookPreparations(ingestionResult, accu.preparations, accu.options);
}

async function cookPreparations (ingestionResult: IngestionResult,
                                 preparations: Preparation<any>[],
                                 preparationsOptions: any[] = []): Promise<Diner> {
  return preparations
    .reduce(
      (promise: Promise<Diner>, preparation: Preparation<any>, index: number) => promise
        .then(async (currentValue: Diner) => {
          const initialOptions: any = preparationsOptions.length > index ? preparationsOptions[ index ] : {};
          const { fields: newFields, options: preparationOptions }: PreparationInitResult<any>
            = await preparation.init(initialOptions, currentValue.fields);
          const newRecords = preparation.cook(currentValue.records, preparationOptions);
          return {
            fields: newFields,
            records: newRecords,
            recipe: [
              ...currentValue.recipe,
              { id: preparation.id, options: preparation.serializeOptions(preparationOptions) },
            ],
          };
        }),
      Promise.resolve({ ...ingestionResult, recipe: [] } as Diner),
    );
}

export async function cook (options: CliOptions): Promise<void> {
  const { source, ingester, outputPath, preparations, recipe } = options;

  const ingesterOptions = await ingester.init({}); // TODO: read options somewhere?
  // @ts-ignore
  const ingestionResult: IngestionResult = await ingester.ingest(source, ingesterOptions);

  const result: Diner = !!preparations
    ? await cookPreparations(ingestionResult, preparations)
    : await cookRecipe(ingestionResult, recipe || []);

  process.stdout.write(`Final records: ${JSON.stringify(result)}\n`);
}
