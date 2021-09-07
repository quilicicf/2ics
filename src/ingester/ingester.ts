import { csvIngester } from './csvIngester.js';
import { jsonIngester } from './jsonIngester.js';

export interface IngestionResult {
  fields: string[];
  records: Record<string, any>[];
}

export interface Ingester<O extends Record<string, any>> {
  id: string;
  displayName: string;
  startMessage: string;
  init: (options: Partial<O>) => Promise<O>;
  ingest: (source: string, options: O) => Promise<IngestionResult>;
}

export const ALL_INGESTERS: { [ key: string ]: Ingester<any> } = {
  [ csvIngester.id ]: csvIngester,
  [ jsonIngester.id ]: jsonIngester,
};
