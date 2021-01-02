import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import _ from 'lodash';
import undoable from 'redux-undo';

import { reorderItemInList, moveItemBetweenLists } from 'utils/common';
import {
  updatePositions,
  getNextAvailablePosition,
  changeLineup,
  applyPlateAppearance,
  cleanUpAfterPlateAppearance,
  changePlayerPosition,
  applyMidGameLineupChange,
} from './stateHelpers';
import { getAvailablePositionsForTeam, getCurrentLineup, getTeamWithRole } from './utils';

import { HalfInning, TeamRole } from '@dugout-companion/shared';
import {
  Team,
  AddPlayerPayload,
  MovePlayerPayload,
  ChangePlayerPositionPayload,
  GameStatus,
  AppGameState,
  PlateAppearance,
  CreatedLineups,
} from './types';

const makeInitialTeamState = (role: TeamRole): Team => ({
  name: '',
  role,
  lineups: [],
  winner: null,
});

const initialState: AppGameState = {
  status: GameStatus.NOT_STARTED,
  teams: [makeInitialTeamState(TeamRole.AWAY), makeInitialTeamState(TeamRole.HOME)],
  inning: 1,
  halfInning: HalfInning.TOP,
  baseRunners: [],
  outs: 0,
  gameEventRecords: [],
  score: [0, 0],
  gameLength: 1,
  playerAtBat: '',
  upNextHalfInning: '',
  nextLineupId: 1,
  lineups: null,
  editingLineups: false,
  lineupDrafts: {
    [TeamRole.AWAY]: [],
    [TeamRole.HOME]: [],
  },
};

const { actions: gameActions, reducer } = createSlice({
  name: 'game',
  initialState,
  reducers: {
    addPlayerToGame(state, { payload: { teamRole, playerId } }: PayloadAction<AddPlayerPayload>) {
      const team = getTeamWithRole(state.teams, teamRole);
      if (!team.lineups.length) {
        team.lineups.push({
          id: state.nextLineupId,
          originalClientId: null,
          lineupSpots: [],
        });
        state.nextLineupId++;
      }
      const lineup = getCurrentLineup(team);
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
          getCurrentLineup(team),
          payload.startIndex,
          payload.endIndex
        );
        changeLineup(state, payload.fromTeam, newLineup);
      } else {
        const sourceTeam = getTeamWithRole(state.teams, payload.fromTeam);
        const destTeam = getTeamWithRole(state.teams, payload.toTeam);
        const oldSourceLineup = getCurrentLineup(sourceTeam);
        const oldDestLineup = getCurrentLineup(destTeam);
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
          !getAvailablePositionsForTeam(destTeam).includes(position)
        ) {
          newDestLineup = changePlayerPosition(newDestLineup, playerId);
        }

        changeLineup(state, payload.fromTeam, updatePositions(newSourceLineup));
        changeLineup(state, payload.toTeam, updatePositions(newDestLineup));
      }
    },
    removePlayerFromGame(state, { payload }: PayloadAction<string>) {
      const team = state.teams.find(team => _.some(getCurrentLineup(team), { playerId: payload }))!;
      const newLineup = updatePositions(
        getCurrentLineup(team).filter(spot => spot.playerId !== payload)
      );
      changeLineup(state, team.role, newLineup);
    },
    changePlayerPosition(state, { payload }: PayloadAction<ChangePlayerPositionPayload>) {
      const team = state.teams.find(team =>
        _.some(getCurrentLineup(team), { playerId: payload.playerId })
      )!;
      const lineup = getCurrentLineup(team);
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
    startGame(state) {
      state.playerAtBat = getCurrentLineup(getTeamWithRole(state.teams, TeamRole.AWAY))[0].playerId;
      state.upNextHalfInning = getCurrentLineup(
        getTeamWithRole(state.teams, TeamRole.HOME)
      )[0].playerId;
      state.status = GameStatus.IN_PROGRESS;
    },
    recordPlateAppearance(state, { payload }: PayloadAction<PlateAppearance>) {
      applyPlateAppearance(state, payload);

      const [awayScore, homeScore] = state.score;
      const homeLeadingAfterTop =
        state.outs === 3 && state.halfInning === HalfInning.TOP && awayScore < homeScore;
      const awayLeadingAfterBottom =
        state.outs === 3 && state.halfInning === HalfInning.BOTTOM && awayScore > homeScore;

      if (
        state.inning >= state.gameLength &&
        (homeLeadingAfterTop ||
          awayLeadingAfterBottom ||
          (state.halfInning === HalfInning.BOTTOM && awayScore < homeScore))
      ) {
        state.status = GameStatus.FINISHED;
      } else {
        cleanUpAfterPlateAppearance(state);
      }
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
      state.gameLength = Math.max(state.inning, state.gameLength) + 1;
      state.status = GameStatus.IN_PROGRESS;
      cleanUpAfterPlateAppearance(state);
    },
    resetGame: state => ({
      ...initialState,
      teams: state.teams.map(team => ({
        ...makeInitialTeamState(team.role),
        lineups: [
          {
            id: initialState.nextLineupId,
            originalClientId: null,
            lineupSpots: getCurrentLineup(team),
          },
        ],
      })),
    }),
    fullResetGame: () => ({ ...initialState }),
    substituteLineupIds(state, { payload }: PayloadAction<CreatedLineups>) {
      const lineupMap = new Map(
        _.flatten(
          payload.teams.map(team =>
            team.lineups.map(({ id, originalClientId }) => [originalClientId, id])
          )
        )
      );
      payload.teams.forEach(({ role }) => {
        const team = getTeamWithRole(state.teams, role);
        team.lineups.forEach(lineup => {
          lineup.originalClientId = lineup.id;
          lineup.id = lineupMap.get(lineup.originalClientId)!;
        });
      });
      state.gameEventRecords.forEach(({ gameEvent, gameStateBefore, gameStateAfter }) => {
        if (gameEvent.lineupChange) {
          gameEvent.lineupChange.lineupBeforeId = lineupMap.get(
            gameEvent.lineupChange.lineupBeforeId
          )!;
          gameEvent.lineupChange.lineupAfterId = lineupMap.get(
            gameEvent.lineupChange.lineupAfterId
          )!;
        }
        [gameStateBefore, gameStateAfter].forEach(gameState => {
          gameState.lineups?.forEach(lineup => {
            lineup.id = lineupMap.get(lineup.id)!;
          });
        });
      });
    },
  },
});

export { gameActions };

const lineupEditActions = [
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
  clearHistoryType: [gameActions.resetGame.type, gameActions.fullResetGame.type],
  neverSkipReducer: true,
});
