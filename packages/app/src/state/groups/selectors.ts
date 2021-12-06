import _ from 'lodash';
import { createSelector } from 'reselect';

import { AppState } from 'state/store';

export const getCurrentGroup = (state: AppState) => state.groups.currentGroup;
export const getAllGroups = (state: AppState) => state.groups.all;

export const getCurrentGroupName = createSelector(
  getAllGroups,
  getCurrentGroup,
  (all, currentId) => _.find(all, { id: currentId })?.name
);
