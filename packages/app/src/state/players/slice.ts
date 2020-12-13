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

const { actions: playerActions, reducer } = createSlice({
  name: 'players',
  initialState: {} as PlayerMap,
  reducers: {
    loadPlayers: (_state, { payload }: PayloadAction<Player[]>) =>
      _.reduce(
        payload,
        (all, player) => ({
          ...all,
          [player.id]: player,
        }),
        {} as PlayerMap
      ),
    addPlayer: {
      reducer(state, { payload }: PayloadAction<Player>) {
        if (!doesPlayerExist(payload, state)) {
          state[payload.id] = payload;
        }
      },
      prepare: (player: NewPlayer) => ({ payload: { ...player, id: uuidv1() } }),
    },
  },
});

export { playerActions };
export default reducer;
