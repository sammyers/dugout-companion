import { createSelector } from '@reduxjs/toolkit';
import _ from 'lodash';

import { getAllPlayersList, getPlayerGetter } from 'state/players/selectors';
import { formatShortName } from 'state/players/utils';
import { getPlateAppearanceDetailPrompt } from 'state/prompts/prompts';
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
} from '@dugout-companion/shared';
import { AppState } from 'state/store';
import { BaseRunnerMap, GameState, GameStatus, LineupSpot } from './types';

const MIN_PLAYERS_TO_PLAY = 8;

export const getTeams = (state: AppState) => state.game.present.teams;

export const getRunners = (state: AppState) => state.game.present.baseRunners;
export const getRunnerMap = createSelector(getRunners, runnersToMap);

export const getNumOuts = (state: AppState) => state.game.present.outs;
export const getScore = (state: AppState) => state.game.present.score;
export const getHalfInning = (state: AppState) => state.game.present.halfInning;
export const getInning = (state: AppState) => state.game.present.inning;
export const getCurrentBatter = (state: AppState) => state.game.present.playerAtBat;

export const getBattingTeamRole = createSelector(getHalfInning, half =>
  half === HalfInning.BOTTOM ? TeamRole.HOME : TeamRole.AWAY
);
export const getFieldingTeamRole = createSelector(getHalfInning, half =>
  half === HalfInning.BOTTOM ? TeamRole.AWAY : TeamRole.HOME
);

export const getTeam = (state: AppState, role: TeamRole) => getTeamWithRole(getTeams(state), role);
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

const getBatter = (state: AppState) => state.game.present.playerAtBat;
export const getBatterName = createSelector(getBatter, getPlayerGetter, (batterId, getPlayer) =>
  formatShortName(getPlayer(batterId))
);

export const getPlayerAtPosition = (state: AppState, role: TeamRole, position: FieldingPosition) =>
  getPlayerAtPositionFromTeams(getTeams(state), role, position);

export const getPlayerPosition = (state: AppState, playerId: string) => {
  const team = getTeams(state).find(team => _.some(getCurrentLineup(team), { playerId }));
  return _.find(getCurrentLineup(team!), { playerId })!.position;
};

export const getLineups = createSelector(getTeams, teams => teams.map(getCurrentLineup));
export const getLineup = (state: AppState, teamRole: TeamRole) =>
  getCurrentLineup(getTeam(state, teamRole));

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

export const getGameStatus = (state: AppState) => state.game.present.status;
export const isGameInProgress = createSelector(
  getGameStatus,
  status => status === GameStatus.IN_PROGRESS
);
export const isGameOver = createSelector(getGameStatus, status => status === GameStatus.FINISHED);

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

export const createPlateAppearancePromptSelector = (paType: PlateAppearanceType) =>
  createSelector(
    getCurrentBatter,
    getNumOuts,
    getRunnerMap,
    doesFieldingTeamHaveFourOutfielders,
    (batterId, outs, runners, fourOutfielders) =>
      getPlateAppearanceDetailPrompt(paType, batterId!, outs, runners, fourOutfielders)
  );

export const getGameHistory = (state: AppState) => state.game.present.gameEventRecords;

export const getCurrentGameLength = (state: AppState) => state.game.present.gameLength;
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

export const getPresent = (state: AppState) => state.game.present;
export const getPast = (state: AppState) => state.game.past;
export const getFuture = (state: AppState) => state.game.future;

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
        ({ gameEvent, gameStateBefore, gameStateAfter, scoredRunners }) => {
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
