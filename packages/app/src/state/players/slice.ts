import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import _ from 'lodash';
import { v1 as uuidv1 } from 'uuid';

import { Player, NewPlayer } from './types';

const doesPlayerExist = (newPlayer: NewPlayer, players: Record<string, Player>) =>
  _.some(
    players,
    player => player.firstName === newPlayer.firstName && player.lastName === newPlayer.lastName
  );

type PlayerMap = Record<string, Player>;

export interface PlayerState {
  synced: PlayerMap;
  unsynced: PlayerMap;
}

const initialState: PlayerState = {
  synced: {},
  unsynced: {},
};

interface SyncPlayerPayload {
  offlineId: string;
  id: string;
}

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
        {} as PlayerMap
      );
    },
    loadPlayer(state, { payload }: PayloadAction<Player>) {
      state.synced[payload.id] = payload;
    },
    createPlayerOffline: {
      reducer(state, { payload }: PayloadAction<Player>) {
        if (!doesPlayerExist(payload, state.unsynced)) {
          state.unsynced[payload.id] = payload;
        }
      },
      prepare: (player: NewPlayer) => ({ payload: { ...player, id: uuidv1() } }),
    },
    syncPlayer(state, { payload }: PayloadAction<SyncPlayerPayload>) {
      state.synced[payload.id] = { ...state.unsynced[payload.offlineId], id: payload.id };
      delete state.unsynced[payload.offlineId];
    },
  },
});

export { playerActions };
export default reducer;
