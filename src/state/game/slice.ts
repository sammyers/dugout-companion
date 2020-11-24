import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import _ from 'lodash';

import { reorderItemInList, moveItemBetweenLists } from 'utils/common';
import { getCurrentBaseForRunner, getBattingTeam, getOnDeckBatter } from './partialSelectors';
import {
  getNewBase,
  getDefaultRunnersAfterPlateAppearance,
  allPositions,
  forEachRunner,
  moveRunner,
  removeRunner,
  moveRunnersOnGroundBall,
  getLeadRunner,
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
  RecordedPlay,
  ContactType,
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
      const { atBat, inning, halfInning, outs, runners, score } = state;
      const recordedPlay: RecordedPlay = {
        event: payload,
        gameState: { atBat, inning, halfInning, outs, runners, score },
        runnersBattedIn: [],
        runnersScored: [],
      };

      const recordRunnersScored = (runners: string[], battedIn = true) => {
        if (battedIn) {
          recordedPlay.runnersBattedIn.push(...runners);
        }
        recordedPlay.runnersScored.push(...runners);
      };

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
            recordRunnersScored([payload.runnerId], false);
          }
        } else {
          delete state.runners[startBase];
          state.outs++;
        }
      } else if (payload.kind === 'plateAppearance') {
        switch (payload.type) {
          case PlateAppearanceType.HOMERUN:
            updateScore(state, _.size(state.runners) + 1);
            recordRunnersScored([...(_.values(state.runners) as string[]), atBat!]);
            state.runners = {};
            break;
          case PlateAppearanceType.TRIPLE:
            updateScore(state, _.size(state.runners));
            recordRunnersScored(_.values(state.runners) as string[]);
            state.runners = { [BaseType.THIRD]: atBat };
            break;
          case PlateAppearanceType.DOUBLE:
          case PlateAppearanceType.SINGLE:
          case PlateAppearanceType.WALK:
            const [newBaseRunners, runnersScored] = getDefaultRunnersAfterPlateAppearance(
              state.runners,
              payload.type,
              atBat!
            );
            state.runners = newBaseRunners;
            updateScore(state, runnersScored.length);
            recordRunnersScored(runnersScored);
            break;
          case PlateAppearanceType.SACRIFICE_FLY:
            _.times(payload.runsScoredOnSacFly!, () => {
              const [base, runnerId] = getLeadRunner(runners)!;
              moveRunner(runners, base, null);
              updateScore(state);
              recordRunnersScored([runnerId]);
            });
            state.outs++;
            break;
          case PlateAppearanceType.FIELDERS_CHOICE: {
            removeRunner(state.runners, payload.runnersOutOnPlay[0]);
            const runnersScored = moveRunnersOnGroundBall(state.runners);
            state.runners[BaseType.FIRST] = atBat;
            if (runnersScored.length && outs < 2) {
              updateScore(state);
              recordRunnersScored(runnersScored);
            }
            state.outs++;
            break;
          }
          case PlateAppearanceType.DOUBLE_PLAY:
            state.outs += 2;
            payload.runnersOutOnPlay.forEach(runnerId => {
              removeRunner(state.runners, runnerId);
            });
            if (payload.contactType === ContactType.GROUNDER) {
              const runnersScored = moveRunnersOnGroundBall(state.runners);
              if (runnersScored.length && outs === 0) {
                updateScore(state, runnersScored.length);
                recordRunnersScored(runnersScored, false);
              }
            }
            if (!payload.runnersOutOnPlay.includes(atBat!)) {
              state.runners[BaseType.FIRST] = atBat;
            }
            break;
          case PlateAppearanceType.OUT:
            if (payload.contactType === ContactType.GROUNDER) {
              const runnersScored = moveRunnersOnGroundBall(state.runners);
              if (runnersScored.length && outs < 2) {
                updateScore(state, runnersScored.length);
                recordRunnersScored(runnersScored);
              }
            }
            state.outs++;
            break;
        }

        forEachRunner(state.runners, (runnerId, base) => {
          if (runnerId in payload.outsOnBasepaths) {
            delete state.runners[base];
            state.outs++;
          } else if (runnerId in payload.basesTaken) {
            if (moveRunner(state.runners, base, payload.basesTaken[runnerId])) {
              updateScore(state);
              recordRunnersScored([runnerId], payload.type !== PlateAppearanceType.DOUBLE_PLAY);
            }
          }
        });

        state.gameHistory.push(recordedPlay);

        const nextBatter = getOnDeckBatter(state);
        if (state.outs === 3) {
          state.atBat = state.upNextHalfInning;
          state.upNextHalfInning = nextBatter;
          state.runners = {};
          state.outs = 0;
          if (state.halfInning === HalfInning.BOTTOM) {
            state.inning++;
          }
          state.halfInning = 1 - halfInning;
        } else {
          state.atBat = nextBatter;
        }
      }
    },
  },
});

export { gameActions };
export default reducer;
