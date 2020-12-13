import { createSelector } from '@reduxjs/toolkit';
import _ from 'lodash';

import { HalfInning, TeamRole } from '@dugout-companion/shared';

import { getBaseForRunner, getCurrentLineup, getTeamWithRole, runnersToMap } from './utils';

import { AppGameState, LineupSpot } from './types';

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

const getNextBatter = (batterId: string | undefined, lineup: LineupSpot[]) => {
  const lineupIndex = _.findIndex(lineup, ({ playerId }) => playerId === batterId);
  if (lineupIndex === lineup.length - 1) {
    return lineup[0].playerId;
  }
  return lineup[lineupIndex + 1].playerId;
};
export const getOnDeckBatter = createSelector(getCurrentBatter, getBattingLineup, getNextBatter);
