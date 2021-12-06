import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
      state.currentGroup = payload[0].id;
    },
  },
});

export default reducer;
export { groupActions };
