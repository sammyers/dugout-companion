import { createSelector } from '@reduxjs/toolkit';
import _ from 'lodash';

import { getGameHistory, getGameStateGetter, getTeams } from 'state/game/selectors';
import { getCurrentLineup } from 'state/game/utils';
import { aggregateStats, getRateStats, initialStats, formatDecimal } from './stats';

import { BoxScoreRow } from './types';

export const getBoxScore = createSelector(
  getGameHistory,
  getTeams,
  getGameStateGetter,
  (history, teams, gameStateGetter) => {
    const allStats = aggregateStats(history, gameStateGetter);
    return teams.map(team => {
      const lineup = getCurrentLineup(team);
      return lineup.map(({ playerId }, index) => {
        const playerStats = allStats[playerId] ?? initialStats;
        return {
          playerId,
          lineupSpot: index + 1,
          ...playerStats,
          ..._.mapValues(getRateStats(playerStats), val =>
            _.isNaN(val) ? '---' : formatDecimal(val)
          ),
        };
      });
    }) as [BoxScoreRow[], BoxScoreRow[]];
  }
);
