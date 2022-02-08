import { createSelector } from '@reduxjs/toolkit';

import { HalfInning, TeamRole } from '@sammyers/dc-shared';

import {
  getBaseForRunner,
  getCurrentLineup,
  getNextBatter,
  getTeamWithRole,
  runnersToMap,
} from './utils';

import { AppGameState, GameState } from './types';

const initialGameState: GameState = {
  id: '',
  inning: 1,
  halfInning: HalfInning.TOP,
  baseRunners: [],
  outs: 0,
  score: [0, 0],
  playerAtBat: '',
  lineups: null,
};

export const getCurrentGameState = (state: AppGameState) => state.gameState ?? initialGameState;
export const getTeams = (state: AppGameState) => state.teams;
export const getRunners = createSelector(getCurrentGameState, state => state.baseRunners);
export const getRunnerMap = createSelector(getRunners, runnersToMap);
export const getCurrentBatter = createSelector(getCurrentGameState, state => state.playerAtBat);
export const getNumOuts = createSelector(getCurrentGameState, state => state.outs);
export const getScore = createSelector(getCurrentGameState, state => state.score);
export const getHalfInning = createSelector(getCurrentGameState, state => state.halfInning);
export const getInning = createSelector(getCurrentGameState, state => state.inning);

export const getPrevGameStates = (state: AppGameState) => state.prevGameStates;
export const getEventRecords = (state: AppGameState) => state.gameEventRecords;

export const getCurrentBaseForRunner = (state: AppGameState, playerId: string) =>
  getBaseForRunner(getRunnerMap(state), playerId);

export const getBattingTeamRole = createSelector(getHalfInning, half =>
  half === HalfInning.BOTTOM ? TeamRole.HOME : TeamRole.AWAY
);
export const getFieldingTeamRole = createSelector(getHalfInning, half =>
  half === HalfInning.BOTTOM ? TeamRole.AWAY : TeamRole.HOME
);
export const getBattingTeam = createSelector(getTeams, getBattingTeamRole, getTeamWithRole);
export const getFieldingTeam = createSelector(getTeams, getFieldingTeamRole, getTeamWithRole);
export const getBattingLineup = createSelector(getBattingTeam, getCurrentLineup);
export const getFieldingLineup = createSelector(getFieldingTeam, getCurrentLineup);

export const isBattingTeamSoloModeOpponent = createSelector(
  getBattingTeam,
  team => !!team.soloModeOpponent
);

export const getOnDeckBatter = createSelector(getCurrentBatter, getBattingLineup, getNextBatter);

export const isEditingLineups = (state: AppGameState) => state.editingLineups;
export const getLineupDrafts = (state: AppGameState) => state.lineupDrafts;
export const getDraftLineup = (state: AppGameState, role: TeamRole) => getLineupDrafts(state)[role];

export const getTeam = (state: AppGameState, role: TeamRole) =>
  getTeamWithRole(getTeams(state), role);

export const getLineupToEdit = (state: AppGameState, teamRole: TeamRole) =>
  isEditingLineups(state)
    ? getDraftLineup(state, teamRole)
    : getCurrentLineup(getTeam(state, teamRole));
export const isSoloModeActive = (state: AppGameState) => state.soloMode;
export const getSoloModeOpponentPositions = (state: AppGameState) =>
  state.soloModeOpponentPositions;
export const getProtagonistTeamRole = (state: AppGameState) =>
  state.teams.find(team => !team.soloModeOpponent)!.role;
const getOpponentTeamRole = (state: AppGameState) =>
  state.teams.find(team => team.soloModeOpponent)?.role;
export const getOpponentTeamName = (state: AppGameState) => {
  const role = getOpponentTeamRole(state);
  const team = role && getTeam(state, role);
  return team?.name;
};
export const isOpponentTeamBatting = createSelector(
  getOpponentTeamRole,
  getBattingTeamRole,
  (opponentTeam, battingTeam) => opponentTeam === battingTeam
);
