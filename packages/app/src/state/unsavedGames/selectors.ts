import _ from 'lodash';
import { createSelector } from 'reselect';
import { AppState } from 'state/store';

export const getUnsavedGames = (state: AppState) => state.unsavedGames;
export const getNumUnsavedGames = createSelector(getUnsavedGames, _.size);
