import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { formatISO } from 'date-fns';
import _, { slice } from 'lodash';
import undoable from 'redux-undo';
import { v4 as uuid4 } from 'uuid';

import { groupActions } from 'state/groups/slice';
import { reorderItemInList, moveItemBetweenLists } from 'utils/common';
import { getBattingTeamRole, getLineupToEdit } from './partialSelectors';
import {
  updatePositions,
  getNextAvailablePosition,
  changeLineup,
  applyPlateAppearance,
  cleanUpAfterPlateAppearance,
  changePlayerPosition,
  applyMidGameLineupChange,
  getCurrentLineupsFromTeams,
  makeGameEvent,
} from './stateHelpers';
import {
  getAvailablePositionsForLineup,
  getCurrentLineup,
  previousHalfInning,
  getTeamWithRole,
} from './utils';

import { FieldingPosition, HalfInning, TeamRole } from '@sammyers/dc-shared';
import {
  Team,
  AddPlayerPayload,
  MovePlayerPayload,
  ChangePlayerPositionPayload,
  GameStatus,
  AppGameState,
  PlateAppearance,
} from './types';

const makeInitialTeamState = (role: TeamRole): Team => ({
  name: '',
  role,
  lineups: [],
  winner: null,
});

const initialState: AppGameState = {
  name: '',
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
    changeTeamName(state, { payload }: PayloadAction<{ role: TeamRole; name: string }>) {
      state.teams.find(({ role }) => role === payload.role)!.name = payload.name;
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
    startGame: {
      prepare: () => ({
        payload: {
          gameId: uuid4(),
          stateId: uuid4(),
          time: formatISO(new Date()),
        },
      }),
      reducer(state, action: PayloadAction<{ gameId: string; stateId: string; time: string }>) {
        state.gameId = action.payload.gameId;
        state.timeStarted = action.payload.time;
        state.gameState = {
          id: action.payload.stateId,
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
    changePositionsRetroactive(
      state,
      { payload }: PayloadAction<Record<FieldingPosition, string>>
    ) {
      const [prevHalfInning, prevInning] = previousHalfInning(
        state.gameState!.halfInning,
        state.gameState!.inning
      );
      const firstIndex = _.findIndex(state.prevGameStates, {
        inning: prevInning,
        halfInning: prevHalfInning,
      });
      const previousFieldingTeam = getBattingTeamRole(state);
      const teamLineups = _.find(state.teams, { role: previousFieldingTeam })!.lineups;
      const firstStateOfHalfInning = state.prevGameStates[firstIndex];
      const eventIndex = _.findIndex(state.gameEventRecords, {
        gameStateBeforeId: firstStateOfHalfInning.id,
      });
      const firstEventOfHalfInning = state.gameEventRecords[eventIndex];

      if (firstEventOfHalfInning.gameEvent.lineupChange) {
        const { lineupAfterId } = firstEventOfHalfInning.gameEvent.lineupChange;
        // Check if the first event was already a lineup change, we've probably already done this
        const lineupToSwap = _.find(teamLineups, { id: lineupAfterId });
        if (lineupToSwap) {
          lineupToSwap.lineupSpots = lineupToSwap.lineupSpots.map(({ position }) => ({
            position,
            playerId: payload[position!],
          }));
          return;
        }
      }

      const { id: originalLineupId } = firstStateOfHalfInning.lineups!.find(
        lineup => lineup.team.role === previousFieldingTeam
      )!;
      const originalLineup = _.find(teamLineups, { id: originalLineupId })!;
      const newLineup = {
        id: uuid4(),
        lineupSpots: originalLineup.lineupSpots.map(({ position }) => ({
          position,
          playerId: payload[position!],
        })),
      };
      teamLineups.push(newLineup);
      state.gameState!.lineups = getCurrentLineupsFromTeams(state.teams);

      const newLineupReference = { id: newLineup.id, team: { role: previousFieldingTeam } };
      // New state to fill in the gap created by the lineup change
      const newState = {
        ...firstStateOfHalfInning,
        id: uuid4(),
        lineups: firstStateOfHalfInning.lineups!.map(lineup =>
          lineup.team.role === previousFieldingTeam ? newLineupReference : lineup
        ),
      };

      // Create new lineup change event and insert into the appropriate place in the history
      const lineupChangeEvent = makeGameEvent({
        lineupChange: { lineupBeforeId: originalLineup.id, lineupAfterId: newLineup.id },
      });
      state.gameEventRecords = [
        ..._.slice(state.gameEventRecords, 0, eventIndex),
        {
          eventIndex,
          gameEvent: lineupChangeEvent,
          scoredRunners: [],
          gameStateBeforeId: firstStateOfHalfInning.id,
          gameStateAfterId: newState.id,
        },
        {
          ...firstEventOfHalfInning,
          eventIndex: eventIndex + 1,
          gameStateBeforeId: newState.id,
        },
        ...slice(state.gameEventRecords, eventIndex + 1).map(eventRecord => ({
          ...eventRecord,
          eventIndex: eventRecord.eventIndex + 1,
        })),
      ];

      state.prevGameStates = [
        ..._.slice(state.prevGameStates, 0, firstIndex + 1),
        newState,
        ..._.slice(state.prevGameStates, firstIndex + 1).map(state => ({
          ...state,
          lineups: state.lineups!.map(lineup =>
            lineup.team.role === previousFieldingTeam ? newLineupReference : lineup
          ),
        })),
      ];
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
    changeGameName(state, { payload }: PayloadAction<string>) {
      state.name = payload;
    },
    setTimeEnded(state, { payload }: PayloadAction<string>) {
      state.timeEnded = payload;
    },
    extendGame(state) {
      state.gameLength = Math.max(state.gameState?.inning ?? 0, state.gameLength) + 1;
      state.status = GameStatus.IN_PROGRESS;
      state.timeEnded = undefined;
      state.teams.forEach(team => {
        team.winner = null;
      });
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
    builder.addCase(groupActions.setCurrentGroup, state => {
      state.teams.forEach(team => {
        team.lineups = [
          {
            id: uuid4(),
            lineupSpots: [],
          },
        ];
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
    gameActions.changePositionsRetroactive.type,
  ],
  neverSkipReducer: true,
});
