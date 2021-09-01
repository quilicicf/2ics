import { parseDatePreparation } from './date.js';
import { fieldCompositionPreparation } from './fieldComposition.js';
import { filterPreparation, invertedFilterPreparation } from './filter.js';
export const ALL_PREPARATIONS = {
    [fieldCompositionPreparation.id]: fieldCompositionPreparation,
    [filterPreparation.id]: filterPreparation,
    [invertedFilterPreparation.id]: invertedFilterPreparation,
    [parseDatePreparation.id]: parseDatePreparation,
};
