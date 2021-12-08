import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { APP_DEFAULT_GROUP } from '@sammyers/dc-shared';

import { Group } from './types';

export interface GroupState {
  currentGroup?: string;
  all: Group[];
}

const { reducer, actions: groupActions } = createSlice({
  name: 'groups',
  initialState: { all: [] } as GroupState,
  reducers: {
    loadGroups: (state, { payload }: PayloadAction<Group[]>) => {
      state.all = payload;
      if (!state.currentGroup) {
        state.currentGroup = (
          payload.find(group => group.id === APP_DEFAULT_GROUP) ?? payload[0]
        ).id;
      }
    },
    setCurrentGroup: (state, { payload }: PayloadAction<string>) => {
      state.currentGroup = payload;
    },
  },
});

export default reducer;
export { groupActions };
