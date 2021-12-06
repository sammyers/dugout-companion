import { createSelector } from '@reduxjs/toolkit';
import _ from 'lodash';

import { getAllPlayersList, getPlayerGetter } from 'state/players/selectors';
import { formatShortName } from 'state/players/utils';
import * as partialSelectors from './partialSelectors';
import {
  getAvailablePositionsForLineup,
  getCurrentLineup,
  getPlayerAtPositionFromTeams,
  getTeamWithRole,
  shouldLineupHaveFourOutfielders,
} from './utils';

import {
  FieldingPosition,
  GameInput,
  HalfInning,
  PlateAppearanceType,
  TeamRole,
} from '@sammyers/dc-shared';
import { AppState } from 'state/store';
import { BaseRunnerMap, GameStatus, LineupSpot } from './types';
import { getCurrentGroup } from 'state/groups/selectors';

const MIN_PLAYERS_TO_PLAY = 8;

export const getPresent = (state: AppState) => state.game.present;
export const getPast = (state: AppState) => state.game.past;
export const getFuture = (state: AppState) => state.game.future;

export const getTeams = createSelector(getPresent, partialSelectors.getTeams);
export const getBatter = createSelector(getPresent, partialSelectors.getCurrentBatter);
export const getRunners = createSelector(getPresent, partialSelectors.getRunners);
export const getRunnerMap = createSelector(getPresent, partialSelectors.getRunnerMap);
export const getGameStatus = createSelector(getPresent, state => state.status);
export const getNumOuts = createSelector(getPresent, partialSelectors.getNumOuts);
export const getScore = createSelector(getPresent, partialSelectors.getScore);
export const getHalfInning = createSelector(getPresent, partialSelectors.getHalfInning);
export const getInning = createSelector(getPresent, partialSelectors.getInning);
export const getCurrentBatter = createSelector(getPresent, partialSelectors.getCurrentBatter);
export const getCurrentGameLength = createSelector(getPresent, state => state.gameLength);
export const getGameHistory = createSelector(getPresent, state => state.gameEventRecords);
export const isEditingLineups = createSelector(getPresent, partialSelectors.isEditingLineups);
export const getLineupDrafts = createSelector(getPresent, partialSelectors.getLineupDrafts);
export const getPrevGameStates = createSelector(getPresent, partialSelectors.getPrevGameStates);

export const getGameStateGetter = createSelector(getPresent, state => (gameStateId: string) => {
  if (state.gameState?.id === gameStateId) {
    return state.gameState;
  }
  return state.prevGameStates.find(({ id }) => id === gameStateId)!;
});

export const isGameInProgress = createSelector(
  getGameStatus,
  status => status === GameStatus.IN_PROGRESS
);
export const isGameOver = createSelector(getGameStatus, status => status === GameStatus.FINISHED);

export const isLineupEditable = createSelector(
  isGameInProgress,
  isEditingLineups,
  (inProgress, editing) => !inProgress || editing
);

export const getDraftLineup = (state: AppState, role: TeamRole) =>
  partialSelectors.getDraftLineup(getPresent(state), role);

export const getBattingTeamRole = createSelector(getHalfInning, half =>
  half === HalfInning.BOTTOM ? TeamRole.HOME : TeamRole.AWAY
);
export const getFieldingTeamRole = createSelector(getHalfInning, half =>
  half === HalfInning.BOTTOM ? TeamRole.AWAY : TeamRole.HOME
);

export const getTeam = (state: AppState, role: TeamRole) =>
  partialSelectors.getTeam(getPresent(state), role);
export const getBattingTeam = createSelector(getTeams, getBattingTeamRole, getTeamWithRole);
export const getFieldingTeam = createSelector(getTeams, getFieldingTeamRole, getTeamWithRole);

export const getTeamName = (state: AppState, role: TeamRole) => getTeam(state, role).name;

export const getBattingLineup = createSelector(getBattingTeam, getCurrentLineup);
export const getFieldingLineup = createSelector(getFieldingTeam, getCurrentLineup);

export const doesFieldingTeamHaveFourOutfielders = createSelector(
  getFieldingLineup,
  shouldLineupHaveFourOutfielders
);

export const getRunnerNames = createSelector(
  getRunnerMap,
  getPlayerGetter,
  (runners, getPlayer): BaseRunnerMap =>
    _.mapValues<BaseRunnerMap>(runners, (id: string) => formatShortName(getPlayer(id)))
);

export const getBatterName = createSelector(getBatter, getPlayerGetter, (batterId, getPlayer) =>
  formatShortName(getPlayer(batterId))
);

export const getPlayerAtPosition = (state: AppState, role: TeamRole, position: FieldingPosition) =>
  getPlayerAtPositionFromTeams(getTeams(state), role, position);

export const getPlayerPosition = (state: AppState, playerId: string) => {
  if (isEditingLineups(state)) {
    const drafts = getLineupDrafts(state);
    const allSpots = [...drafts.AWAY, ...drafts.HOME];
    return allSpots.find(spot => spot.playerId === playerId)!.position;
  } else {
    const team = getTeams(state).find(team => _.some(getCurrentLineup(team), { playerId }))!;
    return _.find(getCurrentLineup(team), { playerId })!.position;
  }
};

export const getLineups = createSelector(getTeams, teams => teams.map(getCurrentLineup));
export const getLineupToEdit = (state: AppState, teamRole: TeamRole) =>
  partialSelectors.getLineupToEdit(getPresent(state), teamRole);

export const getAvailablePositions = (state: AppState, role: TeamRole) => {
  const lineup = getLineupToEdit(state, role);
  return getAvailablePositionsForLineup(lineup);
};

export const getPlayersNotInGame = createSelector(
  getAllPlayersList,
  getLineups,
  (allPlayers, lineups) => {
    const allPlayersInGame = _.flatten(lineups);
    return allPlayers.filter(({ id }) => !_.some(allPlayersInGame, { playerId: id }));
  }
);

export const canStartGame = createSelector(
  getLineups,
  ([{ length: numAwayPlayers }, { length: numHomePlayers }]) =>
    Math.abs(numAwayPlayers - numHomePlayers) <= 1 &&
    numAwayPlayers >= MIN_PLAYERS_TO_PLAY &&
    numHomePlayers >= MIN_PLAYERS_TO_PLAY
);

export const getPlateAppearanceOptions = createSelector(getRunners, getNumOuts, (runners, outs) => {
  const notPossible: Set<PlateAppearanceType> = new Set();

  if (!_.size(runners)) {
    notPossible.add(PlateAppearanceType.FIELDERS_CHOICE);
  }

  if (outs === 2 || !_.size(runners)) {
    notPossible.add(PlateAppearanceType.DOUBLE_PLAY);
    notPossible.add(PlateAppearanceType.SACRIFICE_FLY);
  }

  return _.values(PlateAppearanceType).filter(paType => !notPossible.has(paType));
});

const getNextBatter = (batterId: string | undefined, lineup: LineupSpot[]) => {
  if (!lineup.length) {
    return '';
  }
  const lineupIndex = _.findIndex(lineup, ({ playerId }) => playerId === batterId);
  if (lineupIndex === lineup.length - 1) {
    return lineup[0].playerId;
  }
  return lineup[lineupIndex + 1].playerId;
};
export const getOnDeckBatter = createSelector(getCurrentBatter, getBattingLineup, getNextBatter);
export const getInTheHoleBatter = createSelector(getOnDeckBatter, getBattingLineup, getNextBatter);
export const getOnDeckBatterName = createSelector(
  getOnDeckBatter,
  getPlayerGetter,
  (batterId, getPlayer) => formatShortName(getPlayer(batterId))
);
export const getInTheHoleBatterName = createSelector(
  getInTheHoleBatter,
  getPlayerGetter,
  (batterId, getPlayer) => formatShortName(getPlayer(batterId))
);

export const getMinGameLength = createSelector(
  getInning,
  getHalfInning,
  getScore,
  (inning, halfInning, [awayScore, homeScore]) => {
    if (halfInning === HalfInning.BOTTOM && homeScore > awayScore) {
      return Math.max(7, inning + 1);
    }
    return Math.max(7, inning);
  }
);
export const getMaxGameLength = () => 12;

export const isGameInExtraInnings = createSelector(
  getInning,
  getCurrentGameLength,
  (inning, gameLength) => inning > gameLength
);

export const wasGameSaved = createSelector(getPresent, game => game.saved);

export const isUndoPossible = createSelector(getPast, past => past.length > 0);
export const isRedoPossible = createSelector(getFuture, future => future.length > 0);

export const getGameName = createSelector(getPresent, game => game.name);
export const getGameId = createSelector(getPresent, game => game.gameId);
export const getTimeStarted = createSelector(getPresent, game => game.timeStarted);
export const getTimeEnded = createSelector(getPresent, game => game.timeEnded);

export const getWinningTeamName = (state: AppState) => {
  const [awayScore, homeScore] = getScore(state);
  const role = awayScore > homeScore ? TeamRole.AWAY : TeamRole.HOME;
  const name = getTeamName(state, role);
  return name || `${_.capitalize(role)} Team`;
};

export const getGameForMutation = createSelector(
  getGameId,
  getGameName,
  getCurrentGroup,
  getTimeStarted,
  getTimeEnded,
  getTeams,
  getScore,
  getCurrentGameLength,
  getPrevGameStates,
  getGameHistory,
  (
    id,
    name,
    groupId,
    timeStarted,
    timeEnded,
    teams,
    score,
    gameLength,
    gameStates,
    gameEventRecords
  ): GameInput => ({
    id,
    name,
    groupId,
    timeStarted: timeStarted!,
    timeEnded: timeEnded!,
    score,
    gameLength,
    teams: {
      create: teams.map(({ name, role, winner, lineups }) => ({
        name,
        role,
        winner,
        lineups: {
          create: lineups.map(({ id, lineupSpots }) => ({
            id,
            lineupSpots: {
              create: lineupSpots.map((spot, battingOrder) => ({ battingOrder, ...spot })),
            },
          })),
        },
      })),
    },
    gameStates: {
      create: gameStates.map((gameState, i) => ({
        gameStateIndex: i,
        ..._.omit(gameState, 'lineups'),
        lineupForGameStates: {
          create: gameState.lineups!.map(({ id }) => ({ lineupId: id })),
        },
        baseRunners: {
          create: gameState.baseRunners,
        },
      })),
    },
    gameEventRecords: {
      create: gameEventRecords.map(
        ({ gameEvent, gameStateBeforeId, gameStateAfterId, scoredRunners }, eventIndex) => {
          let event;
          if (gameEvent.lineupChange) {
            event = {
              lineupChange: {
                create: gameEvent.lineupChange,
              },
            };
          } else if (gameEvent.stolenBaseAttempt) {
            event = {
              stolenBaseAttempt: {
                create: gameEvent.stolenBaseAttempt,
              },
            };
          } else if (gameEvent.plateAppearance) {
            event = {
              plateAppearance: {
                create: {
                  ...gameEvent.plateAppearance,
                  basepathMovements: {
                    create: gameEvent.plateAppearance.basepathMovements,
                  },
                  outOnPlayRunners: {
                    create: gameEvent.plateAppearance.outOnPlayRunners,
                  },
                },
              },
            };
          }

          return {
            eventIndex,
            gameEvent: { create: event },
            gameStateBeforeId,
            gameStateAfterId,
            scoredRunners: { create: scoredRunners },
          };
        }
      ),
    },
  })
);
