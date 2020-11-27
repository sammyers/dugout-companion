import { createSelector } from '@reduxjs/toolkit';
import _ from 'lodash';

import { getShortPlayerName, getAllPlayersList } from 'state/players/selectors';
import { getPlateAppearanceDetailPrompt } from 'state/prompts/prompts';
import { getAvailablePositionsForTeam, shouldTeamUseFourOutfielders } from './utils';

import { AppState } from 'state/store';
import {
  BaseRunners,
  TeamRole,
  PlateAppearanceType,
  HalfInning,
  FieldingPosition,
  GameStatus,
} from './types';

const MIN_PLAYERS_TO_PLAY = 8;

export const getTeams = (state: AppState) => state.game.teams;

export const getRunners = (state: AppState) => state.game.runners;
export const getNumOuts = (state: AppState) => state.game.outs;
export const getScore = (state: AppState) => state.game.score;
export const getHalfInning = (state: AppState) => state.game.halfInning;
export const getInning = (state: AppState) => state.game.inning;
export const getCurrentBatter = (state: AppState) => state.game.atBat;

export const getBattingTeam = createSelector(getHalfInning, half =>
  half === HalfInning.BOTTOM ? TeamRole.HOME : TeamRole.AWAY
);

export const getBattingLineup = createSelector(
  getTeams,
  getBattingTeam,
  (teams, battingTeam) => teams[battingTeam].lineup
);

export const getAvailablePositions = (state: AppState, team: TeamRole) =>
  getAvailablePositionsForTeam(getTeams(state)[team]);

export const doesFieldingTeamHaveFourOutfielders = createSelector(
  getTeams,
  getHalfInning,
  (teams, halfInning) => shouldTeamUseFourOutfielders(teams[1 - halfInning])
);

export const getRunnerNames = createSelector(
  state => state,
  getRunners,
  (state, runners): BaseRunners =>
    _.mapValues<BaseRunners>(runners, (id: string) => getShortPlayerName(state, id))
);

const getBatter = (state: AppState) => state.game.atBat;
export const getBatterName = createSelector(
  state => state,
  getBatter,
  (state, batterId) => (batterId ? getShortPlayerName(state, batterId) : '')
);

export const getPlayerAtPosition = (state: AppState, team: TeamRole, position: FieldingPosition) =>
  _.findKey(state.game.teams[team].positions, p => p === position)!;

export const getPlayerPosition = (state: AppState, playerId: string) => {
  const { positions } = _.find(getTeams(state), ({ lineup }) => lineup.includes(playerId))!;
  return positions[playerId];
};

export const getLineups = createSelector(
  getTeams,
  teams => teams.map(team => team.lineup) as [string[], string[]]
);
export const getLineup = (state: AppState, teamRole: TeamRole) => getTeams(state)[teamRole].lineup;

export const getPlayersNotInGame = createSelector(
  getAllPlayersList,
  getLineups,
  (allPlayers, lineups) => {
    const allPlayersInGame = _.flatten(lineups);
    return allPlayers.filter(({ playerId }) => !allPlayersInGame.includes(playerId));
  }
);

export const canStartGame = createSelector(
  getLineups,
  ([{ length: numAwayPlayers }, { length: numHomePlayers }]) =>
    Math.abs(numAwayPlayers - numHomePlayers) <= 1 &&
    numAwayPlayers >= MIN_PLAYERS_TO_PLAY &&
    numHomePlayers >= MIN_PLAYERS_TO_PLAY
);

export const getGameStatus = (state: AppState) => state.game.status;
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

const getNextBatter = (batterId: string | undefined, lineup: string[]) => {
  const lineupIndex = _.findIndex(lineup, id => id === batterId);
  if (lineupIndex === lineup.length - 1) {
    return lineup[0];
  }
  return lineup[lineupIndex + 1];
};
export const getOnDeckBatter = createSelector(getCurrentBatter, getBattingLineup, getNextBatter);
export const getInTheHoleBatter = createSelector(getOnDeckBatter, getBattingLineup, getNextBatter);
export const getOnDeckBatterName = createSelector(
  state => state,
  getOnDeckBatter,
  getShortPlayerName
);
export const getInTheHoleBatterName = createSelector(
  state => state,
  getInTheHoleBatter,
  getShortPlayerName
);

export const createPlateAppearancePromptSelector = (paType: PlateAppearanceType) =>
  createSelector(
    getCurrentBatter,
    getNumOuts,
    getRunners,
    doesFieldingTeamHaveFourOutfielders,
    (batterId, outs, runners, fourOutfielders) =>
      getPlateAppearanceDetailPrompt(paType, batterId!, outs, runners, fourOutfielders)
  );

export const getGameHistory = (state: AppState) => state.game.gameHistory;

export const getCurrentGameLength = (state: AppState) => state.game.gameLength;
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
