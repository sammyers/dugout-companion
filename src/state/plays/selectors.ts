import { createSelector } from '@reduxjs/toolkit';
import _ from 'lodash';
import { getGameHistory, getPlayerAtPosition } from 'state/game/selectors';

import { HalfInning, RecordedPlay } from 'state/game/types';
import { getPlayDescription } from './plays';
import { getShortPlayerName } from 'state/players/selectors';

export const getAllPlays = createSelector(
  getGameHistory,
  state => state,
  (history, state) => {
    const groupedPlaysByInning = history.reduce((groupedPlays, play) => {
      const { inning, halfInning } = play.gameState;
      if (!groupedPlays.length) {
        groupedPlays.push({ inning, halfInning, plays: [play] });
      } else {
        const lastGroup = _.last(groupedPlays)!;
        if (lastGroup.inning !== inning || lastGroup.halfInning !== halfInning) {
          groupedPlays.push({ inning, halfInning, plays: [play] });
        } else {
          lastGroup.plays.push(play);
        }
      }
      return groupedPlays;
    }, [] as { inning: number; halfInning: HalfInning; plays: RecordedPlay[] }[]);

    return groupedPlaysByInning.map(({ inning, halfInning, plays }) => ({
      inning,
      halfInning,
      plays: plays.map(play => {
        const { description, playerIds, position, newNumOuts, newScore } = getPlayDescription(play);
        let interpolatedDescription = description;
        if (position) {
          interpolatedDescription = description.replace(
            new RegExp(`{${position}}`),
            getShortPlayerName(
              state,
              getPlayerAtPosition(state, 1 - play.gameState.halfInning, position)
            )
          );
        }
        playerIds.forEach(playerId => {
          interpolatedDescription = interpolatedDescription.replace(
            new RegExp(`{${playerId}}`, 'g'),
            getShortPlayerName(state, playerId)
          );
        });

        return {
          description: interpolatedDescription,
          outs: newNumOuts,
          score: newScore,
          type: play.event.kind === 'plateAppearance' ? play.event.type : undefined,
        };
      }),
    }));
  }
);

export const getScoringPlays = createSelector(getAllPlays, groups =>
  groups
    .map(({ inning, halfInning, plays }) => ({
      inning,
      halfInning,
      plays: plays.filter(play => !!play.score),
    }))
    .filter(group => group.plays.length)
);
