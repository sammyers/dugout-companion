import { createSelector } from '@reduxjs/toolkit';
import _ from 'lodash';

import { getCurrentGroup, getCurrentGroupId, getCurrentGroupName } from 'state/groups/selectors';
import { getAllPlayersList, getPlayerGetter } from 'state/players/selectors';
import { formatShortName } from 'state/players/utils';
import * as partialSelectors from './partialSelectors';
import {
  getAvailablePositionsForLineup,
  getCurrentLineup,
  getPlayerAtPositionFromTeams,
  isNextBaseAvailable,
  previousHalfInning,
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
import { _shouldShowEndGameNowButton } from './stateHelpers';

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

export const getFirstBatterNextInning = createSelector(getPresent, state => state.upNextHalfInning);

export const getGameStateMap = createSelector(getPrevGameStates, states => _.keyBy(states, 'id'));
export const getGameStateGetter = createSelector(
  getPresent,
  getGameStateMap,
  (state, prevStates) => (gameStateId: string) => {
    if (state.gameState?.id === gameStateId) {
      return state.gameState;
    }
    return prevStates[gameStateId];
  }
);

export const isSoloModeActive = createSelector(getPresent, partialSelectors.isSoloModeActive);

export const getSoloModeOpponentPositions = createSelector(
  getPresent,
  partialSelectors.getSoloModeOpponentPositions
);
export const getProtagonistTeamRole = createSelector(
  getPresent,
  partialSelectors.getProtagonistTeamRole
);
export const getOpponentTeamName = createSelector(getPresent, partialSelectors.getOpponentTeamName);

export const getOpponentTeamSize = createSelector(getPresent, state =>
  _.some([FieldingPosition.MIDDLE_INFIELD, FieldingPosition.LEFT_CENTER], position =>
    state.soloModeOpponentPositions.includes(position)
  )
    ? 'large'
    : 'small'
);
export const isOpponentTeamBatting = createSelector(
  getPresent,
  partialSelectors.isOpponentTeamBatting
);

export const isBeforeGame = createSelector(
  getGameStatus,
  status => status === GameStatus.NOT_STARTED
);

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

export const getBattingTeamRole = createSelector(getPresent, partialSelectors.getBattingTeamRole);
export const getFieldingTeamRole = createSelector(getPresent, partialSelectors.getFieldingTeamRole);
export const getBattingTeam = createSelector(getPresent, partialSelectors.getBattingTeam);
export const getFieldingTeam = createSelector(getPresent, partialSelectors.getFieldingTeam);
export const getBattingLineup = createSelector(getPresent, partialSelectors.getBattingLineup);
export const getFieldingLineup = createSelector(getPresent, partialSelectors.getFieldingLineup);

const shouldShowProtagonistFieldingWhileAwayTeam = createSelector(
  isSoloModeActive,
  isBeforeGame,
  getFieldingTeamRole,
  getProtagonistTeamRole,
  (soloMode, preGame, fieldingRole, protagonistRole) =>
    soloMode && preGame && protagonistRole !== fieldingRole
);
export const getRoleForFielderChange = createSelector(
  shouldShowProtagonistFieldingWhileAwayTeam,
  showProtagonistAwayLineup => (showProtagonistAwayLineup ? TeamRole.AWAY : TeamRole.HOME)
);
export const getFieldingLineupForFielderChange = createSelector(
  getFieldingLineup,
  getBattingLineup,
  getRoleForFielderChange,
  (fieldingLineup, battingLineup, fielderChangeRole) =>
    fielderChangeRole === TeamRole.AWAY ? battingLineup : fieldingLineup
);

export const isProtagonistFielding = createSelector(
  isOpponentTeamBatting,
  shouldShowProtagonistFieldingWhileAwayTeam,
  (opponentBatting, protagonistFielding) => opponentBatting || protagonistFielding
);

export const getScoreAfterSoloModeInning = (state: AppState, runsScored: number) => {
  const halfInning = getHalfInning(state);
  const [awayScore, homeScore] = getScore(state);
  if (halfInning === HalfInning.TOP) {
    return [awayScore + runsScored, homeScore];
  } else {
    return [awayScore, homeScore + runsScored];
  }
};

export const getTeam = (state: AppState, role: TeamRole) =>
  partialSelectors.getTeam(getPresent(state), role);

export const getTeamName = (state: AppState, role: TeamRole) => getTeam(state, role).name;

export const getOccupiedFieldingPositions = createSelector(
  getFieldingTeam,
  getSoloModeOpponentPositions,
  (fieldingTeam, soloModePositions) => {
    if (fieldingTeam.soloModeOpponent) {
      return soloModePositions;
    }
    return getCurrentLineup(fieldingTeam)
      .filter(spot => !!spot.position)
      .map(spot => spot.position!);
  }
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

export const getLineupToEdit = (state: AppState, teamRole: TeamRole) =>
  partialSelectors.getLineupToEdit(getPresent(state), teamRole);

export const getLineups = createSelector(getPresent, partialSelectors.getLineups);

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
  isSoloModeActive,
  getOpponentTeamName,
  getProtagonistTeamRole,
  ([{ length: numAwayPlayers }, { length: numHomePlayers }], soloMode, opponentName, teamRole) => {
    if (soloMode) {
      return (
        !!opponentName &&
        (teamRole === TeamRole.AWAY ? numAwayPlayers : numHomePlayers) >= MIN_PLAYERS_TO_PLAY
      );
    }
    return (
      Math.abs(numAwayPlayers - numHomePlayers) <= 1 &&
      numAwayPlayers >= MIN_PLAYERS_TO_PLAY &&
      numHomePlayers >= MIN_PLAYERS_TO_PLAY
    );
  }
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

export const areTiesAllowed = createSelector(getPresent, state => state.allowTies);
export const areDBOsInningEnding = createSelector(getPresent, state => state.inningEndingDBOs);
export const hasGameTimeExpired = createSelector(getPresent, state => state.gameTimeExpired);
export const isGameInLastInning = createSelector(
  getInning,
  getCurrentGameLength,
  (inning, gameLength) => inning === gameLength
);
export const isGameInExtraInnings = createSelector(
  getInning,
  getCurrentGameLength,
  (inning, gameLength) => inning > gameLength
);

export const shouldShowTimeLimitExpiredToggle = createSelector(
  areTiesAllowed,
  getScore,
  getHalfInning,
  isGameInLastInning,
  (tiesAllowed, [awayScore, homeScore], halfInning, inLastInning) => {
    if (!tiesAllowed) return false;
    if (halfInning === HalfInning.BOTTOM) {
      // If the home team is winning, the user should just press the end game button
      return homeScore <= awayScore;
    }
    return true;
  }
);
export const shouldShowEndGameNowButton = createSelector(
  getHalfInning,
  getScore,
  _shouldShowEndGameNowButton
);

export const getMinGameLength = createSelector(
  getInning,
  getHalfInning,
  getScore,
  getCurrentGroupName,
  isSoloModeActive,
  areTiesAllowed,
  (inning, halfInning, [awayScore, homeScore], groupName, soloMode, tiesAllowed) => {
    const defaultMin = soloMode || groupName === 'Testing' ? 2 : 7;
    if (halfInning === HalfInning.BOTTOM && homeScore > awayScore && !tiesAllowed) {
      return Math.max(defaultMin, inning + 1);
    }
    return Math.max(defaultMin, inning);
  }
);
export const getMaxGameLength = createSelector(
  isSoloModeActive,
  hasGameTimeExpired,
  getInning,
  (soloMode, gameTimeExpired, inning) => {
    if (gameTimeExpired) {
      return inning;
    }
    if (soloMode) {
      return 9;
    }
    return 12;
  }
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
  if (awayScore === homeScore) {
    return undefined;
  }
  const role = awayScore > homeScore ? TeamRole.AWAY : TeamRole.HOME;
  const name = getTeamName(state, role);
  return name || `${_.capitalize(role)} Team`;
};

export const isRetroactiveFielderChangePossible = createSelector(
  getHalfInning,
  getInning,
  getGameHistory,
  getPrevGameStates,
  getBattingTeam,
  (halfInning, inning, events, gameStates, battingTeam) => {
    if (halfInning === HalfInning.TOP && inning === 1) {
      return false;
    }
    // Check if any lineup changes have happened since then
    const [prevHalfInning, prevInning] = previousHalfInning(halfInning, inning);
    const firstGameStateInPrevHalfInning = _.find(gameStates, {
      inning: prevInning,
      halfInning: prevHalfInning,
    });
    const firstEventIndexInPrevHalfInning = _.findIndex(events, {
      gameStateBeforeId: firstGameStateInPrevHalfInning?.id,
    });
    if (
      _.some(
        _.slice(events, firstEventIndexInPrevHalfInning + 1),
        event =>
          event.gameEvent.lineupChange &&
          _.some(battingTeam.lineups, { id: event.gameEvent.lineupChange.lineupBeforeId })
      )
    ) {
      return false;
    }
    return true;
  }
);

export const getPreviousHalfInning = createSelector(
  getHalfInning,
  getInning,
  (halfInning, inning): [HalfInning, number] | undefined => {
    if (inning === 1 && halfInning === HalfInning.TOP) {
      return;
    }
    const oppositeHalfInning =
      halfInning === HalfInning.BOTTOM ? HalfInning.TOP : HalfInning.BOTTOM;
    if (halfInning === HalfInning.BOTTOM) {
      return [oppositeHalfInning, inning];
    }
    return [oppositeHalfInning, inning - 1];
  }
);

export const getAllPlayersThatHaveBatted = createSelector(
  getGameHistory,
  getGameStateGetter,
  (events, getGameState) =>
    new Set(
      events
        .filter(({ gameEvent }) => gameEvent.plateAppearance || gameEvent.atBatSkip)
        .map(event => getGameState(event.gameStateBeforeId).playerAtBat)
    )
);

export const canReorderLineup = (state: AppState, teamRole: TeamRole) => {
  if (!isGameInProgress(state)) return true;
  if (!isEditingLineups(state)) return false;

  const allPreviousBatters = getAllPlayersThatHaveBatted(state);
  const playerAtBat = getCurrentBatter(state);
  const lineup = getLineupToEdit(state, teamRole);
  return lineup.some(
    ({ playerId }) => !allPreviousBatters.has(playerId) && playerId !== playerAtBat
  );
};

export const canReorderPlayer = (state: AppState, teamRole: TeamRole, lineupIndex: number) => {
  if (!isGameInProgress(state)) return true;
  if (!isEditingLineups(state)) return false;

  const lineup = getLineupToEdit(state, teamRole);
  // Adding to the end, not moving an existing player
  if (lineupIndex >= lineup.length) return true;

  const { playerId } = lineup[lineupIndex];
  const allPreviousBatters = getAllPlayersThatHaveBatted(state);
  const playerAtBat = getCurrentBatter(state);

  return !allPreviousBatters.has(playerId) && playerId !== playerAtBat;
};

export const canSkipAtBats = createSelector(
  getCurrentGroup,
  group => group?.allowSkippingAtBats ?? false
);

export const canConfigureSteals = createSelector(
  getCurrentGroup,
  group => group?.allowSteals ?? false
);
export const canStealBases = createSelector(getPresent, state => state.allowSteals);

export const canRunnerStealBase = (state: AppState, runnerId: string) =>
  isNextBaseAvailable(runnerId, getRunnerMap(state));

export const getGameForMutation = createSelector(
  getGameId,
  getGameName,
  getCurrentGroupId,
  getTimeStarted,
  getTimeEnded,
  getTeams,
  getScore,
  getCurrentGameLength,
  getPrevGameStates,
  getGameHistory,
  isSoloModeActive,
  (
    gameId,
    name,
    groupId,
    timeStarted,
    timeEnded,
    teams,
    score,
    gameLength,
    gameStates,
    gameEventRecords,
    soloMode
  ): GameInput => ({
    id: gameId,
    name,
    groupId,
    timeStarted: timeStarted!,
    timeEnded: timeEnded!,
    score,
    gameLength,
    soloMode,
    teams: {
      create: teams.map(({ name, role, winner, lineups, soloModeOpponent }) => ({
        name: name || `${_.capitalize(role)} Team`,
        role,
        winner,
        soloModeOpponent,
        lineups: soloModeOpponent
          ? undefined
          : {
              create: lineups.map(({ id, lineupSpots }) => ({
                id,
                gameId,
                lineupSpots: {
                  create: lineupSpots.map((spot, battingOrder) => ({
                    gameId,
                    battingOrder,
                    ...spot,
                  })),
                },
              })),
            },
      })),
    },
    gameStates: {
      create: gameStates
        .filter(gameState => !(gameState.inning < gameLength && gameState.outs === 3))
        .map((gameState, i) => ({
          gameStateIndex: i,
          ..._.omit(gameState, 'lineups'),
          lineupForGameStates: {
            create: gameState.lineups!.map(({ id }) => ({ gameId, lineupId: id })),
          },
          baseRunners: {
            create: gameState.baseRunners.map(runner => ({ gameId, ...runner })),
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
                create: { gameId, ...gameEvent.lineupChange },
              },
            };
          } else if (gameEvent.stolenBaseAttempt) {
            event = {
              stolenBaseAttempt: {
                create: { gameId, ...gameEvent.stolenBaseAttempt },
              },
            };
          } else if (gameEvent.plateAppearance) {
            event = {
              plateAppearance: {
                create: {
                  gameId,
                  ...gameEvent.plateAppearance,
                  basepathMovements: {
                    create: gameEvent.plateAppearance.basepathMovements.map(movement => ({
                      gameId,
                      ...movement,
                    })),
                  },
                  outOnPlayRunners: {
                    create: gameEvent.plateAppearance.outOnPlayRunners.map(runner => ({
                      gameId,
                      ...runner,
                    })),
                  },
                },
              },
            };
          } else if (gameEvent.soloModeOpponentInning) {
            event = {
              soloModeOpponentInning: {
                create: { gameId, ...gameEvent.soloModeOpponentInning },
              },
            };
          } else if (gameEvent.atBatSkip) {
            event = {
              atBatSkip: {
                create: { gameId, ...gameEvent.atBatSkip },
              },
            };
          } else if (gameEvent.earlyGameEnd) {
            event = {
              earlyGameEnd: {
                create: { gameId, ...gameEvent.earlyGameEnd },
              },
            };
          }

          return {
            eventIndex,
            gameEvent: { create: { gameId, ...event } },
            gameStateBeforeId,
            gameStateAfterId,
            scoredRunners: { create: scoredRunners.map(runner => ({ gameId, ...runner })) },
          };
        }
      ),
    },
  })
);
