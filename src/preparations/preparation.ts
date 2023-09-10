import { addTimePreparation, parseDatePreparation } from './date.ts';
import { fieldCompositionPreparation } from './fieldComposition.ts';
import { filterPreparation, invertedFilterPreparation } from './filter.ts';
import { toIcalPreparation } from './toIcal.ts';

export interface PreparationInitResult<O extends Record<string, any>> {
  fields: string[];
  options: O;
}

export interface Preparation<O extends Record<string, any>> {
  id: string;
  displayName: string;
  startMessage: string,
  // eslint-disable-next-line no-unused-vars
  serializeOptions: (options: O) => Record<string, any>;
  // eslint-disable-next-line no-unused-vars
  deserializeOptions: (options: Record<string, any>) => O;
  // eslint-disable-next-line no-unused-vars
  init: (options: O, fields: string[]) => Promise<PreparationInitResult<O>>;
  // eslint-disable-next-line no-unused-vars
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
