import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import _ from 'lodash';

import { Game } from 'state/game/types';

export interface HistoryState {
  games: Record<number, Game>;
}

const initialState: HistoryState = {
  games: {},
};

const { reducer, actions: historyActions } = createSlice({
  name: 'history',
  initialState,
  reducers: {
    loadGames(state, { payload }: PayloadAction<Game[]>) {
      state.games = _.reduce(
        payload,
        (all, game) => ({
          ...all,
          [game.id]: game,
        }),
        {}
      );
    },
  },
});

export default reducer;
export { historyActions };
