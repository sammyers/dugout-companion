import { createSelector } from 'reselect';

import { AppState } from 'state/store';

export const getAllGroups = (state: AppState) => state.groups.all;
export const getCurrentGroup = (state: AppState) => state.groups.currentGroup;
export const getCurrentGroupId = createSelector(getCurrentGroup, group => group?.id);
export const getCurrentGroupName = createSelector(getCurrentGroup, group => group?.name);
