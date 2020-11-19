import { createSelector } from '@reduxjs/toolkit';
import _ from 'lodash';

import { GameState, HalfInning, TeamRole } from './types';
import { getBaseForRunner } from './utils';

export const getTeams = (state: GameState) => state.teams;
export const getRunners = (state: GameState) => state.runners;
export const getCurrentBatter = (state: GameState) => state.atBat;

export const getCurrentBaseForRunner = (state: GameState, playerId: string) =>
  getBaseForRunner(getRunners(state), playerId);

export const getHalfInning = (state: GameState) => state.halfInning;

export const getBattingTeam = createSelector(getHalfInning, half =>
  half === HalfInning.BOTTOM ? TeamRole.HOME : TeamRole.AWAY
);
export const getBattingLineup = createSelector(
  getTeams,
  getBattingTeam,
  (teams, battingTeam) => teams[battingTeam].lineup
);

export const getOnDeckBatter = createSelector(
  getCurrentBatter,
  getBattingLineup,
  (batterId, lineup) => {
    const lineupIndex = _.findIndex(lineup, id => id === batterId);
    if (lineupIndex === lineup.length - 1) {
      return lineup[0];
    }
    return lineup[lineupIndex + 1];
  }
);
