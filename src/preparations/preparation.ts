import { parseDatePreparation } from './date.js';
import { fieldCompositionPreparation } from './fieldComposition.js';
import { filterPreparation, invertedFilterPreparation } from './filter.js';

export interface PreparationInitResult<O extends object> {
  fields: string[];
  options: O;
}

export interface Preparation<O extends object> {
  id: string;
  displayName: string;
  serializeOptions: (options: O) => Record<string, any>;
  deserializeOptions: (options: Record<string, any>) => O;
  init: (options: O, fields: string[]) => Promise<PreparationInitResult<O>>;
  cook: (records: Record<string, any>[], options: O) => Record<string, any>[];
}

export const ALL_PREPARATIONS: { [ key: string ]: Preparation<any> } = {
  [ fieldCompositionPreparation.id ]: fieldCompositionPreparation,
  [ filterPreparation.id ]: filterPreparation,
  [ invertedFilterPreparation.id ]: invertedFilterPreparation,
  [ parseDatePreparation.id ]: parseDatePreparation,
};
