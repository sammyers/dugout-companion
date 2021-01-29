import { createSelector } from '@reduxjs/toolkit';
import _ from 'lodash';

import { getAllPlayersList, getPlayerGetter } from 'state/players/selectors';
import { formatShortName } from 'state/players/utils';
import * as partialSelectors from './partialSelectors';
import {
  getAvailablePositionsForTeam,
  getCurrentLineup,
  getPlayerAtPositionFromTeams,
  getTeamWithRole,
  runnersToMap,
  shouldTeamUseFourOutfielders,
} from './utils';

import {
  FieldingPosition,
  GameInput,
  GamePatch,
  HalfInning,
  PlateAppearanceType,
  TeamRole,
} from '@sammyers/dc-shared';
import { AppState } from 'state/store';
import { BaseRunnerMap, GameState, GameStatus, LineupSpot } from './types';

const MIN_PLAYERS_TO_PLAY = 8;

export const getPresent = (state: AppState) => state.game.present;
export const getPast = (state: AppState) => state.game.past;
export const getFuture = (state: AppState) => state.game.future;

export const getTeams = createSelector(getPresent, partialSelectors.getTeams);
export const getBatter = createSelector(getPresent, state => state.playerAtBat);
export const getRunners = createSelector(getPresent, state => state.baseRunners);
export const getRunnerMap = createSelector(getRunners, runnersToMap);
export const getGameStatus = createSelector(getPresent, state => state.status);
export const getNumOuts = createSelector(getPresent, state => state.outs);
export const getScore = createSelector(getPresent, state => state.score);
export const getHalfInning = createSelector(getPresent, state => state.halfInning);
export const getInning = createSelector(getPresent, state => state.inning);
export const getCurrentBatter = createSelector(getPresent, state => state.playerAtBat);
export const getCurrentGameLength = createSelector(getPresent, state => state.gameLength);
export const getGameHistory = createSelector(getPresent, state => state.gameEventRecords);
export const isEditingLineups = createSelector(getPresent, partialSelectors.isEditingLineups);
export const getLineupDrafts = createSelector(getPresent, partialSelectors.getLineupDrafts);

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

export const getBattingLineup = createSelector(getBattingTeam, getCurrentLineup);

export const getAvailablePositions = (state: AppState, role: TeamRole) =>
  getAvailablePositionsForTeam(getTeam(state, role));

export const doesFieldingTeamHaveFourOutfielders = createSelector(
  getFieldingTeam,
  shouldTeamUseFourOutfielders
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

export const getGameForMutation = createSelector(
  getPresent,
  ({ teams, score, gameLength }): GameInput => ({
    score,
    gameLength,
    teams: {
      create: teams.map(({ name, role, winner, lineups }) => ({
        name,
        role,
        winner,
        lineups: {
          create: lineups.map(({ id, lineupSpots }) => ({
            originalClientId: id,
            lineupSpots: {
              create: lineupSpots.map((spot, battingOrder) => ({ battingOrder, ...spot })),
            },
          })),
        },
      })),
    },
  })
);

export const getGameEventRecordsForMutation = createSelector(
  getPresent,
  ({ gameEventRecords }): GamePatch => ({
    gameEventRecords: {
      create: gameEventRecords.map(
        ({ gameEvent, gameStateBefore, gameStateAfter, scoredRunners }, eventIndex) => {
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
          const makeGameStateMutation = (gameState: GameState) => ({
            create: {
              ..._.omit(gameState, 'lineups'),
              lineupForGameStates: {
                create: gameState.lineups!.map(({ id }) => ({ lineupId: id })),
              },
              baseRunners: {
                create: gameState.baseRunners,
              },
            },
          });

          return {
            eventIndex,
            gameEvent: { create: event },
            gameStateBefore: makeGameStateMutation(gameStateBefore),
            gameStateAfter: makeGameStateMutation(gameStateAfter),
            scoredRunners: { create: scoredRunners },
          };
        }
      ),
    },
  })
);
