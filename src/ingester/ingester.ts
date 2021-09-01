import { csvIngester } from './csvIngester.js';

export interface IngestionResult {
  fields: string[];
  records: Record<string, any>[];
}

export interface Ingester<O extends object> {
  id: string;
  init: (options: O) => Promise<O>;
  ingest: (source: string, options: O) => Promise<IngestionResult>;
}

export const ALL_INGESTERS: { [ key: string ]: Ingester<any> } = {
  [ csvIngester.id ]: csvIngester,
};
