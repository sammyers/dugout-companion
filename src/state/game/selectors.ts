import { createSelector } from '@reduxjs/toolkit';
import _ from 'lodash';

import { getShortPlayerName } from 'state/players/selectors';

import { AppState } from 'state/store';
import { BaseRunners, TeamRole } from './types';

export const getTeams = (state: AppState) => state.game.teams;

export const getRunners = (state: AppState) => state.game.runners;

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

export const getPlayerPosition = (state: AppState, playerId: string) => {
  const { positions } = _.find(getTeams(state), ({ lineup }) => lineup.includes(playerId))!;
  return positions[playerId];
};

export const getLineup = (state: AppState, teamRole: TeamRole) => getTeams(state)[teamRole].lineup;
