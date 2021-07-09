import { createSelector } from '@reduxjs/toolkit';

import { HalfInning, TeamRole } from '@sammyers/dc-shared';

import {
  getBaseForRunner,
  getCurrentLineup,
  getNextBatter,
  getTeamWithRole,
  runnersToMap,
} from './utils';

import { AppGameState } from './types';

export const getTeams = (state: AppGameState) => state.teams;
export const getRunners = (state: AppGameState) => state.baseRunners;
export const getRunnerMap = createSelector(getRunners, runnersToMap);
export const getCurrentBatter = (state: AppGameState) => state.playerAtBat;

export const getCurrentBaseForRunner = (state: AppGameState, playerId: string) =>
  getBaseForRunner(getRunnerMap(state), playerId);

export const getHalfInning = (state: AppGameState) => state.halfInning;
export const getBattingTeamRole = createSelector(getHalfInning, half =>
  half === HalfInning.BOTTOM ? TeamRole.HOME : TeamRole.AWAY
);
export const getBattingTeam = createSelector(getTeams, getBattingTeamRole, getTeamWithRole);
export const getBattingLineup = createSelector(getBattingTeam, getCurrentLineup);

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
