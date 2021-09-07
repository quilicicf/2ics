import { Ingester, IngestionResult } from './ingester.js';

export interface JsonIngesterOptions {}

export const jsonIngester: Ingester<JsonIngesterOptions> = {
  id: 'JSON',
  displayName: 'JSON ingester',
  startMessage: 'Ingesting JSON file',
  async init (initialOptions: Partial<JsonIngesterOptions>): Promise<JsonIngesterOptions> {
    return initialOptions;
  },
  async ingest (source: string): Promise<IngestionResult> {
    const records: Record<string, any>[] = JSON.parse(source);
    const fields = Object.keys(records[ 0 ]);
    process.stdout.write(`Found fields:\n  * ${fields.join('\n  * ')}\n`);
    return { fields, records };
  },
};
