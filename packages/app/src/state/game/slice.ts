import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import _ from 'lodash';
import undoable from 'redux-undo';
import { v4 as uuid4 } from 'uuid';

import { reorderItemInList, moveItemBetweenLists } from 'utils/common';
import {
  updatePositions,
  getNextAvailablePosition,
  changeLineup,
  applyPlateAppearance,
  cleanUpAfterPlateAppearance,
  changePlayerPosition,
  applyMidGameLineupChange,
  getCurrentLineupsFromTeams,
} from './stateHelpers';
import { getAvailablePositionsForLineup, getCurrentLineup, getTeamWithRole } from './utils';

import { FieldingPosition, HalfInning, TeamRole } from '@sammyers/dc-shared';
import {
  Team,
  AddPlayerPayload,
  MovePlayerPayload,
  ChangePlayerPositionPayload,
  GameStatus,
  AppGameState,
  PlateAppearance,
  GameState,
} from './types';
import { playerActions } from 'state/players/slice';
import { getLineupToEdit } from './partialSelectors';

const makeInitialTeamState = (role: TeamRole): Team => ({
  name: '',
  role,
  lineups: [],
  winner: null,
});

const initialState: AppGameState = {
  status: GameStatus.NOT_STARTED,
  teams: [makeInitialTeamState(TeamRole.AWAY), makeInitialTeamState(TeamRole.HOME)],
  prevGameStates: [],
  gameEventRecords: [],
  gameLength: 9,
  upNextHalfInning: '',
  editingLineups: false,
  lineupDrafts: {
    [TeamRole.AWAY]: [],
    [TeamRole.HOME]: [],
  },
  saved: false,
};

const { actions: gameActions, reducer } = createSlice({
  name: 'game',
  initialState,
  reducers: {
    addPlayerToGame(state, { payload: { teamRole, playerId } }: PayloadAction<AddPlayerPayload>) {
      const team = getTeamWithRole(state.teams, teamRole);
      if (!team.lineups.length) {
        team.lineups.push({
          id: uuid4(),
          lineupSpots: [],
        });
      }
      const lineup = getLineupToEdit(state, team.role);
      if (!_.some(lineup, { playerId })) {
        const newSpot = { playerId, position: getNextAvailablePosition(lineup, true) };
        const newLineup = updatePositions([...lineup, newSpot]);
        changeLineup(state, teamRole, newLineup);
      }
    },
    movePlayer(state, { payload }: PayloadAction<MovePlayerPayload>) {
      if (payload.fromTeam === payload.toTeam) {
        const team = getTeamWithRole(state.teams, payload.fromTeam);
        const newLineup = reorderItemInList(
          getLineupToEdit(state, team.role),
          payload.startIndex,
          payload.endIndex
        );
        changeLineup(state, payload.fromTeam, newLineup);
      } else {
        const sourceTeam = getTeamWithRole(state.teams, payload.fromTeam);
        const destTeam = getTeamWithRole(state.teams, payload.toTeam);
        const oldSourceLineup = getLineupToEdit(state, sourceTeam.role);
        const oldDestLineup = getLineupToEdit(state, destTeam.role);
        let [newSourceLineup, newDestLineup] = moveItemBetweenLists(
          oldSourceLineup,
          oldDestLineup,
          payload.startIndex,
          payload.endIndex
        );
        const { playerId, position } = oldSourceLineup[payload.startIndex];
        const currentPlayerWithPosition = _.find(oldDestLineup, { position });

        if (
          currentPlayerWithPosition ||
          !getAvailablePositionsForLineup(newDestLineup).includes(position as FieldingPosition)
        ) {
          newDestLineup = changePlayerPosition(newDestLineup, playerId);
        }

        changeLineup(state, payload.fromTeam, updatePositions(newSourceLineup));
        changeLineup(state, payload.toTeam, updatePositions(newDestLineup));
      }
    },
    removePlayerFromGame(state, { payload }: PayloadAction<string>) {
      const team = state.teams.find(team =>
        _.some(getLineupToEdit(state, team.role), { playerId: payload })
      )!;
      const newLineup = updatePositions(
        getLineupToEdit(state, team.role).filter(spot => spot.playerId !== payload)
      );
      changeLineup(state, team.role, newLineup);
    },
    changePlayerPosition(state, { payload }: PayloadAction<ChangePlayerPositionPayload>) {
      const team = state.teams.find(team =>
        _.some(getLineupToEdit(state, team.role), { playerId: payload.playerId })
      )!;
      const lineup = getLineupToEdit(state, team.role);
      const currentPlayerWithPosition = _.find(lineup, {
        position: payload.position,
      });
      let newLineup = changePlayerPosition(lineup, payload.playerId, payload.position);

      if (currentPlayerWithPosition) {
        newLineup = changePlayerPosition(
          newLineup,
          currentPlayerWithPosition.playerId,
          _.find(lineup, { playerId: payload.playerId })!.position
        );
      }
      changeLineup(state, team.role, newLineup);
    },
    flipTeams(state) {
      if (state.status === GameStatus.NOT_STARTED) {
        state.teams.reverse();
        state.teams[0].role = TeamRole.AWAY;
        state.teams[1].role = TeamRole.HOME;
      }
    },
    startGame(state) {
      state.gameState = {
        id: uuid4(),
        inning: 1,
        halfInning: HalfInning.TOP,
        baseRunners: [],
        outs: 0,
        score: [0, 0],
        playerAtBat: getCurrentLineup(getTeamWithRole(state.teams, TeamRole.AWAY))[0].playerId,
        lineups: getCurrentLineupsFromTeams(state.teams),
      };
      state.upNextHalfInning = getCurrentLineup(
        getTeamWithRole(state.teams, TeamRole.HOME)
      )[0].playerId;
      state.status = GameStatus.IN_PROGRESS;
    },
    recordPlateAppearance(state, { payload }: PayloadAction<PlateAppearance>) {
      applyPlateAppearance(state, payload);
    },
    editLineup(state) {
      state.editingLineups = true;
      state.teams.forEach(team => {
        state.lineupDrafts[team.role] = getCurrentLineup(team);
      });
    },
    cancelEditingLineup(state) {
      state.editingLineups = false;
      state.lineupDrafts = initialState.lineupDrafts;
    },
    saveLineup(state) {
      state.editingLineups = false;
      state.teams.forEach(team => {
        const editedLineup = state.lineupDrafts[team.role];
        if (!_.isEqual(getCurrentLineup(team), editedLineup)) {
          applyMidGameLineupChange(state, team.role, editedLineup);
        }
      });
      state.lineupDrafts = initialState.lineupDrafts;
    },
    changeGameLength(state, { payload }: PayloadAction<number>) {
      state.gameLength = payload;
    },
    incrementGameLength(state) {
      state.gameLength += 1;
    },
    decrementGameLength(state) {
      state.gameLength -= 1;
    },
    extendGame(state) {
      state.gameLength = Math.max(state.gameState?.inning ?? 0, state.gameLength) + 1;
      state.status = GameStatus.IN_PROGRESS;
      cleanUpAfterPlateAppearance(state);
    },
    resetGame: state => ({
      ...initialState,
      teams: state.teams.map(team => ({
        ...makeInitialTeamState(team.role),
        lineups: [
          {
            id: uuid4(),
            lineupSpots: getCurrentLineup(team),
          },
        ],
      })),
    }),
    fullResetGame: () => ({ ...initialState }),
    setGameSaved(state) {
      state.saved = true;
    },
  },
  extraReducers: builder =>
    builder.addCase(playerActions.syncPlayer, (state, { payload }) => {
      state.teams.forEach(team => {
        team.lineups.forEach(lineup => {
          lineup.lineupSpots.forEach(spot => {
            if (spot.playerId === payload.offlineId) {
              spot.playerId = payload.id;
            }
          });
        });
      });

      const updateGameState = (gameState: GameState) => {
        gameState.baseRunners.forEach(runner => {
          if (runner.runnerId === payload.offlineId) {
            runner.runnerId = payload.id;
          }
        });
        if (gameState.playerAtBat === payload.offlineId) {
          gameState.playerAtBat = payload.id;
        }
      };
      state.prevGameStates.forEach(gameState => {
        updateGameState(gameState);
      });
      if (state.gameState) {
        updateGameState(state.gameState);
      }

      state.gameEventRecords.forEach(event => {
        event.scoredRunners.forEach(runner => {
          if (runner.runnerId === payload.offlineId) {
            runner.runnerId = payload.id;
          }
        });
        const { plateAppearance, stolenBaseAttempt } = event.gameEvent;
        if (plateAppearance) {
          plateAppearance.outOnPlayRunners.forEach(runner => {
            if (runner.runnerId === payload.offlineId) {
              runner.runnerId = payload.id;
            }
          });
          plateAppearance.basepathMovements.forEach(movement => {
            if (movement.runnerId === payload.offlineId) {
              movement.runnerId = payload.id;
            }
          });
        } else if (stolenBaseAttempt) {
          if (stolenBaseAttempt.runnerId === payload.offlineId) {
            stolenBaseAttempt.runnerId = payload.id;
          }
        }
      });
    }),
});

export { gameActions };

const lineupEditActions = [
  gameActions.editLineup,
  gameActions.addPlayerToGame,
  gameActions.movePlayer,
  gameActions.removePlayerFromGame,
  gameActions.changePlayerPosition,
  gameActions.saveLineup,
].map(action => action.type);
export default undoable(reducer, {
  filter: (action, state) => {
    if (action.type === gameActions.recordPlateAppearance.type) {
      return true;
    }
    if (lineupEditActions.includes(action.type) && state.status === GameStatus.IN_PROGRESS) {
      return true;
    }
    return false;
  },
  groupBy: action => {
    if (lineupEditActions.includes(action.type)) {
      return 'lineupEdit';
    }
    return null;
  },
  limit: 10,
  syncFilter: true,
  clearHistoryType: [
    gameActions.resetGame.type,
    gameActions.fullResetGame.type,
    playerActions.syncPlayer.type,
  ],
  neverSkipReducer: true,
});
