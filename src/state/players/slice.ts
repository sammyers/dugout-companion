import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import _ from 'lodash';
import { v1 as uuidv1 } from 'uuid';

import { Player, NewPlayer, NewPlayerWithId, PlayerStats } from './types';

const initialStats: PlayerStats = {
  atBats: 0,
  hits: 0,
  doubles: 0,
  triples: 0,
  homeRuns: 0,
  walks: 0,
  stolenBases: 0,
  caughtStealing: 0,
  runsBattedIn: 0,
  runsScored: 0,
  strikeouts: 0,
  sacrificeFlies: 0,
  groundIntoDoublePlays: 0,
  leftOnBase: 0,
};

const doesPlayerExist = (newPlayer: NewPlayer, players: Record<string, Player>) =>
  _.some(
    players,
    player => player.firstName === newPlayer.firstName && player.lastName === newPlayer.lastName
  );

const { actions, reducer } = createSlice({
  name: 'players',
  initialState: {} as Record<string, Player>,
  reducers: {
    addPlayer: {
      reducer(state, { payload }: PayloadAction<NewPlayerWithId>) {
        if (!doesPlayerExist(payload, state)) {
          state[payload.playerId] = { ...payload, games: 0, stats: initialStats };
        }
      },
      prepare: (player: NewPlayer) => ({ payload: { ...player, playerId: uuidv1() } }),
    },
  },
});

export const { addPlayer } = actions;
export default reducer;
