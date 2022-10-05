import { addTimePreparation, parseDatePreparation } from './date.js';
import { fieldCompositionPreparation } from './fieldComposition.js';
import { filterPreparation, invertedFilterPreparation } from './filter.js';
import { toIcalPreparation } from './toIcal.js';

export interface PreparationInitResult<O extends Record<string, any>> {
  fields: string[];
  options: O;
}

export interface Preparation<O extends Record<string, any>> {
  id: string;
  displayName: string;
  startMessage: string,
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
  [ addTimePreparation.id ]: addTimePreparation,
  [ toIcalPreparation.id ]: toIcalPreparation,
};
