import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import _ from 'lodash';
import { v4 as uuid4 } from 'uuid';

import { Player, NewPlayer } from './types';

type PlayerMap = Record<string, Player>;

const doesPlayerExist = (newPlayer: NewPlayer, players: PlayerMap) =>
  _.some(
    players,
    player => player.firstName === newPlayer.firstName && player.lastName === newPlayer.lastName
  );

export interface PlayerState {
  synced: PlayerMap;
  unsynced: PlayerMap;
}

const initialState: PlayerState = {
  synced: {},
  unsynced: {},
};

const { actions: playerActions, reducer } = createSlice({
  name: 'players',
  initialState,
  reducers: {
    loadPlayers: (state, { payload }: PayloadAction<Player[]>) => {
      state.synced = _.reduce(
        payload,
        (all, player) => ({
          ...all,
          [player.id]: player,
        }),
        {} as Record<string, Player>
      );
      payload.forEach(({ id }) => {
        if (id in state.unsynced) {
          delete state.unsynced[id];
        }
      });
    },
    loadPlayer(state, { payload }: PayloadAction<Player>) {
      state.synced[payload.id] = payload;
      if (payload.id in state.unsynced) {
        delete state.unsynced[payload.id];
      }
    },
    createPlayerOffline: {
      reducer(state, { payload }: PayloadAction<Player>) {
        if (!doesPlayerExist(payload, state.unsynced)) {
          state.unsynced[payload.id] = payload;
        }
      },
      prepare: (player: NewPlayer) => ({ payload: { ...player, id: uuid4() } }),
    },
    syncPlayer(state, { payload }: PayloadAction<string>) {
      state.synced[payload] = state.unsynced[payload];
      delete state.unsynced[payload];
    },
  },
});

export { playerActions };
export default reducer;
