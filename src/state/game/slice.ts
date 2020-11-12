import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import _ from 'lodash';

import { getCurrentBaseForRunner, getBattingTeam, getOnDeckBatter } from './partialSelectors';
import { getNewBase, advanceBaserunnersOnPlateAppearance } from './utils';

import {
  GameState,
  Team,
  AddPlayerPayload,
  HalfInning,
  GameEvent,
  PlateAppearanceType,
  BaseType,
} from './types';

const initialTeamState: Team = {
  name: '',
  lineup: [],
  positions: {},
};

const initialState: GameState = {
  started: false,
  teams: [initialTeamState, initialTeamState],
  inning: 1,
  halfInning: HalfInning.TOP,
  runners: {},
  outs: 0,
  gameHistory: [],
  score: [0, 0],
};

const updateScore = (state: GameState, runs: number = 1) => {
  state.score[getBattingTeam(state)] += runs;
};

const removeRunner = (state: GameState, runnerId: string) => {
  delete state.runners[getCurrentBaseForRunner(state, runnerId)];
};

const { actions, reducer } = createSlice({
  name: 'game',
  initialState,
  reducers: {
    addPlayerToGame(state, { payload }: PayloadAction<AddPlayerPayload>) {
      state.teams[payload.team].lineup.push(payload.playerId);
    },
    startGame(state) {
      state.atBat = state.teams[0].lineup[0];
      state.upNextHalfInning = state.teams[1].lineup[0];
      state.started = true;
    },
    recordGameEvent(state, { payload }: PayloadAction<GameEvent>) {
      if (payload.kind === 'stolenBaseAttempt') {
        const startBase = getCurrentBaseForRunner(state, payload.runnerId);
        if (payload.success) {
          const endBase = getNewBase(startBase);
          delete state.runners[startBase];
          if (endBase) {
            state.runners[endBase] = payload.runnerId;
          } else {
            // runner scored
            updateScore(state);
          }
        } else {
          delete state.runners[startBase];
          state.outs++;
        }
      } else if (payload.kind === 'plateAppearance') {
        switch (payload.type) {
          case PlateAppearanceType.HOMERUN:
            state.runners = {};
            updateScore(state, _.size(state.runners) + 1);
            break;
          case PlateAppearanceType.TRIPLE:
            state.runners = { [BaseType.THIRD]: payload.batterId };
            updateScore(state, _.size(state.runners));
            break;
          case PlateAppearanceType.DOUBLE:
          case PlateAppearanceType.SINGLE:
          case PlateAppearanceType.WALK:
            const [newBaseRunners, runsScored] = advanceBaserunnersOnPlateAppearance(
              state.runners,
              payload.type,
              payload.batterId
            );
            state.runners = newBaseRunners;
            updateScore(state, runsScored);
            break;
          case PlateAppearanceType.SACRIFICE_FLY:
            delete state.runners[BaseType.THIRD];
            state.outs++;
            updateScore(state);
            break;
          case PlateAppearanceType.FIELDERS_CHOICE:
            state.outs++;
            removeRunner(state, payload.runnersOutOnPlay[0]);
            state.runners[BaseType.FIRST] = payload.batterId;
            break;
          case PlateAppearanceType.DOUBLE_PLAY:
            if (payload.runnersOutOnPlay.length > 1) {
              state.runners[BaseType.FIRST] = payload.batterId;
            }
            payload.runnersOutOnPlay.forEach(runnerId => {
              removeRunner(state, runnerId);
            });
            break;
        }

        const nextBatter = getOnDeckBatter(state);
        if (state.outs === 3) {
          state.atBat = state.upNextHalfInning;
          state.upNextHalfInning = nextBatter;
          state.runners = {};
          state.outs = 0;
          if (state.halfInning === HalfInning.BOTTOM) {
            state.inning++;
          }
          state.halfInning = 1 - state.halfInning;
        } else {
          state.atBat = nextBatter;
        }
      }
    },
  },
});

export const { addPlayerToGame } = actions;
export default reducer;
