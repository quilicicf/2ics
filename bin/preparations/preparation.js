import { addTimePreparation, parseDatePreparation } from './date.js';
import { fieldCompositionPreparation } from './fieldComposition.js';
import { filterPreparation, invertedFilterPreparation } from './filter.js';
import { toIcalPreparation } from './toIcal.js';
export const ALL_PREPARATIONS = {
    [fieldCompositionPreparation.id]: fieldCompositionPreparation,
    [filterPreparation.id]: filterPreparation,
    [invertedFilterPreparation.id]: invertedFilterPreparation,
    [parseDatePreparation.id]: parseDatePreparation,
    [addTimePreparation.id]: addTimePreparation,
    [toIcalPreparation.id]: toIcalPreparation,
};
