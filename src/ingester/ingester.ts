import { csvIngester } from './csvIngester.js';

export interface IngestionResult {
  fields: string[];
  records: Record<string, any>[];
}

export interface Ingester<O extends Record<string, any>> {
  id: string;
  init: (options: Partial<O>) => Promise<O>;
  ingest: (source: string, options: O) => Promise<IngestionResult>;
}

export const ALL_INGESTERS: { [ key: string ]: Ingester<any> } = {
  [ csvIngester.id ]: csvIngester,
};
