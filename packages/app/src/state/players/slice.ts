import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import _ from 'lodash';
import { v4 as uuid4 } from 'uuid';

import { Player, NewPlayer, GroupMembership } from './types';

type PlayerMap = Record<string, Player>;

const doesPlayerExist = (newPlayer: NewPlayer, players: PlayerMap) =>
  _.some(
    players,
    player => player.firstName === newPlayer.firstName && player.lastName === newPlayer.lastName
  );

export interface PlayerState {
  syncedPlayers: PlayerMap;
  unsyncedPlayers: PlayerMap;
  unsyncedMemberships: GroupMembership[];
}

const initialState: PlayerState = {
  syncedPlayers: {},
  unsyncedPlayers: {}, // Includes membership links for players not in the database
  unsyncedMemberships: [], // Only membership links for players already in the database
};

const { actions: playerActions, reducer } = createSlice({
  name: 'players',
  initialState,
  reducers: {
    loadPlayers: (state, { payload }: PayloadAction<Player[]>) => {
      state.syncedPlayers = _.reduce(
        payload,
        (all, player) => ({
          ...all,
          [player.id]: player,
        }),
        {} as Record<string, Player>
      );
      payload.forEach(({ id, groups }) => {
        if (id in state.unsyncedPlayers) {
          delete state.unsyncedPlayers[id];
        }
        state.unsyncedMemberships = state.unsyncedMemberships.filter(
          ({ playerId, groupId }) => playerId !== id || !_.some(groups, { groupId })
        );
      });
    },
    loadPlayer(state, { payload }: PayloadAction<Player>) {
      state.syncedPlayers[payload.id] = payload;
      if (payload.id in state.unsyncedPlayers) {
        delete state.unsyncedPlayers[payload.id];
      }
    },
    createPlayerOffline: {
      reducer(state, { payload }: PayloadAction<Player>) {
        if (!doesPlayerExist(payload, state.unsyncedPlayers)) {
          state.unsyncedPlayers[payload.id] = payload;
        }
      },
      prepare: (player: NewPlayer, groupId: string) => ({
        payload: { ...player, id: uuid4(), groups: [{ groupId }] },
      }),
    },
    addPlayerToGroupOffline(state, { payload }: PayloadAction<GroupMembership>) {
      if (payload.playerId in state.unsyncedPlayers) {
        state.unsyncedPlayers[payload.playerId].groups.push({ groupId: payload.groupId });
      } else {
        state.unsyncedMemberships.push(payload);
      }
    },
    syncPlayer(state, { payload }: PayloadAction<string>) {
      state.syncedPlayers[payload] = state.unsyncedPlayers[payload];
      delete state.unsyncedPlayers[payload];
    },
    syncMembership(state, { payload }: PayloadAction<GroupMembership>) {
      state.unsyncedMemberships = state.unsyncedMemberships.filter(
        ({ playerId, groupId }) => playerId !== payload.playerId || groupId !== payload.groupId
      );
    },
  },
});

export { playerActions };
export default reducer;
