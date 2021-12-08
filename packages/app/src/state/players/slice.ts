import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import _ from 'lodash';
import { v4 as uuid4 } from 'uuid';

import { Player, NewPlayer } from './types';

type PlayerMap = Record<string, Player>;
type GroupPlayerMap = Record<string, PlayerMap>;

const doesPlayerExist = (newPlayer: NewPlayer, players: PlayerMap) =>
  _.some(
    players,
    player => player.firstName === newPlayer.firstName && player.lastName === newPlayer.lastName
  );

export interface PlayerState {
  synced: GroupPlayerMap;
  unsynced: GroupPlayerMap;
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
      const groupId = payload[0]?.groupId;
      if (groupId) {
        state.synced[groupId] = _.reduce(
          payload,
          (all, player) => ({
            ...all,
            [player.id]: player,
          }),
          {} as Record<string, Player>
        );
        if (!(groupId in state.unsynced)) {
          state.unsynced[groupId] = {};
        }
        payload.forEach(({ id }) => {
          if (id in state.unsynced[groupId]) {
            delete state.unsynced[id];
          }
        });
      }
    },
    loadPlayer(state, { payload }: PayloadAction<Player>) {
      if (!(payload.groupId in state.synced)) {
        state.synced[payload.groupId] = {};
      }
      state.synced[payload.groupId][payload.id] = payload;
      if (payload.groupId in state.unsynced && payload.id in state.unsynced[payload.groupId]) {
        delete state.unsynced[payload.groupId][payload.id];
      }
    },
    createPlayerOffline: {
      reducer(state, { payload }: PayloadAction<Player>) {
        if (!(payload.groupId in state.unsynced)) {
          state.unsynced[payload.groupId] = {};
        }
        if (!doesPlayerExist(payload, state.unsynced[payload.groupId])) {
          state.unsynced[payload.groupId][payload.id] = payload;
        }
      },
      prepare: (player: NewPlayer) => ({ payload: { ...player, id: uuid4() } }),
    },
    syncPlayer(state, { payload }: PayloadAction<string>) {
      const groupId = _.findKey(state.unsynced, playerMap => payload in playerMap)!;
      if (!(groupId in state.synced)) {
        state.synced[groupId] = {};
      }
      state.synced[groupId][payload] = state.unsynced[groupId][payload];
      delete state.unsynced[groupId][payload];
    },
  },
});

export { playerActions };
export default reducer;
