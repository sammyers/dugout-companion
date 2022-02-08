import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { APP_DEFAULT_GROUP, SOLO_MODE_OPPONENT_GROUP } from '@sammyers/dc-shared';

import { Group } from './types';

export interface GroupState {
  currentGroup?: Group;
  all: Group[];
}

const { reducer, actions: groupActions } = createSlice({
  name: 'groups',
  initialState: { all: [] } as GroupState,
  reducers: {
    loadGroups: (state, { payload }: PayloadAction<Group[]>) => {
      state.all = payload.filter(group => group.name !== SOLO_MODE_OPPONENT_GROUP);
      if (!state.currentGroup) {
        state.currentGroup = payload.find(group => group.id === APP_DEFAULT_GROUP) ?? payload[0];
      }
    },
    setCurrentGroup: (state, { payload }: PayloadAction<Group>) => {
      state.currentGroup = payload;
    },
  },
});

export default reducer;
export { groupActions };
