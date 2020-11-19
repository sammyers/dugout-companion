import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import _ from 'lodash';

import { getCurrentBaseForRunner, getBattingTeam, getOnDeckBatter } from './partialSelectors';
import {
  getNewBase,
  getDefaultRunnersAfterPlateAppearance,
  allPositions,
  forEachRunner,
  moveRunner,
  removeRunner,
} from './utils';

import {
  GameState,
  Team,
  AddPlayerPayload,
  HalfInning,
  GameEvent,
  PlateAppearanceType,
  BaseType,
  MovePlayerPayload,
  ChangePlayerPositionPayload,
} from './types';
import { reorderItemInList, moveItemBetweenLists } from 'utils/common';

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

const getNextAvailablePosition = (currentPositions: Team['positions']) => {
  const takenPositions = _.values(currentPositions);
  return allPositions.find(position => !takenPositions.includes(position))!;
};

const { actions: gameActions, reducer } = createSlice({
  name: 'game',
  initialState,
  reducers: {
    addPlayerToGame(state, { payload }: PayloadAction<AddPlayerPayload>) {
      const { lineup, positions } = state.teams[payload.team];
      if (!lineup.includes(payload.playerId)) {
        lineup.push(payload.playerId);
        positions[payload.playerId] = getNextAvailablePosition(positions);
      }
    },
    movePlayer(state, { payload }: PayloadAction<MovePlayerPayload>) {
      if (payload.fromTeam === payload.toTeam) {
        const team = state.teams[payload.fromTeam];
        team.lineup = reorderItemInList(team.lineup, payload.startIndex, payload.endIndex);
      } else {
        const sourceTeam = state.teams[payload.fromTeam];
        const destTeam = state.teams[payload.toTeam];
        const [newSourceLineup, newDestLineup] = moveItemBetweenLists(
          sourceTeam.lineup,
          destTeam.lineup,
          payload.startIndex,
          payload.endIndex
        );
        const playerId = sourceTeam.lineup[payload.startIndex];
        sourceTeam.lineup = newSourceLineup;
        destTeam.lineup = newDestLineup;
        const currentPlayerWithPosition = _.findKey(
          destTeam.positions,
          position => position === sourceTeam.positions[playerId]
        );
        if (currentPlayerWithPosition) {
          destTeam.positions[playerId] = getNextAvailablePosition(destTeam.positions);
        } else {
          destTeam.positions[playerId] = sourceTeam.positions[playerId];
        }
        delete sourceTeam.positions[playerId];
      }
    },
    removePlayerFromGame(state, { payload }: PayloadAction<string>) {
      state.teams.forEach(team => {
        team.lineup = team.lineup.filter(playerId => playerId !== payload);
        delete team.positions[payload];
      });
    },
    changePlayerPosition(state, { payload }: PayloadAction<ChangePlayerPositionPayload>) {
      const { positions } = state.teams.find(({ lineup }) => lineup.includes(payload.playerId))!;
      const currentPlayerWithPosition = _.findKey(
        positions,
        position => position === payload.position
      );
      if (currentPlayerWithPosition) {
        positions[currentPlayerWithPosition] = positions[payload.playerId];
      }
      positions[payload.playerId] = payload.position;
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
            updateScore(state, _.size(state.runners) + 1);
            state.runners = {};
            break;
          case PlateAppearanceType.TRIPLE:
            updateScore(state, _.size(state.runners));
            state.runners = { [BaseType.THIRD]: state.atBat };
            break;
          case PlateAppearanceType.DOUBLE:
          case PlateAppearanceType.SINGLE:
          case PlateAppearanceType.WALK:
            const [newBaseRunners, runsScored] = getDefaultRunnersAfterPlateAppearance(
              state.runners,
              payload.type,
              state.atBat!
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
            removeRunner(state.runners, payload.runnersOutOnPlay[0]);
            state.runners[BaseType.FIRST] = state.atBat;
            break;
          case PlateAppearanceType.DOUBLE_PLAY:
            if (payload.runnersOutOnPlay.length > 1) {
              state.runners[BaseType.FIRST] = state.atBat;
            }
            payload.runnersOutOnPlay.forEach(runnerId => {
              removeRunner(state.runners, runnerId);
            });
            break;
          case PlateAppearanceType.OUT:
            state.outs++;
            break;
        }

        forEachRunner(state.runners, (runnerId, base) => {
          if (runnerId in payload.extraOutsOnBasepaths) {
            delete state.runners[base];
            state.outs++;
          } else if (runnerId in payload.extraBasesTaken) {
            const newBase = getNewBase(base, payload.extraBasesTaken[runnerId]);
            if (newBase) {
              moveRunner(state.runners, base, newBase);
            } else {
              delete state.runners[base];
              updateScore(state);
            }
          }
        });

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

export { gameActions };
export default reducer;
