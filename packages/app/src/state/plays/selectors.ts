import { createSelector } from '@reduxjs/toolkit';
import _ from 'lodash';

import {
  getFuture,
  getGameHistory,
  getPlayerAtPositionFromTeams,
  getTeams,
} from 'state/game/selectors';
import { getPlayerGetter } from 'state/players/selectors';
import { formatShortName } from 'state/players/utils';
import { getPlayDescription } from './plays';

import { HalfInning, RecordedPlay, Team } from 'state/game/types';
import { Player } from 'state/players/types';
import { HalfInningPlaysGroup, PlayDescription } from './types';

const makeInterpolatedPlayDescription = (
  play: RecordedPlay,
  playerGetter: (playerId: string) => Player,
  teams: [Team, Team]
): PlayDescription => {
  const { description, playerIds, position, newNumOuts, newScore } = getPlayDescription(play);
  let interpolatedDescription = description;
  if (position) {
    interpolatedDescription = description.replace(
      new RegExp(`{${position}}`),
      formatShortName(
        playerGetter(getPlayerAtPositionFromTeams(teams, 1 - play.gameState.halfInning, position))
      )
    );
  }
  playerIds.forEach(playerId => {
    interpolatedDescription = interpolatedDescription.replace(
      new RegExp(`{${playerId}}`, 'g'),
      formatShortName(playerGetter(playerId))
    );
  });

  return {
    description: interpolatedDescription,
    outs: newNumOuts,
    score: newScore,
    type: play.event.kind === 'plateAppearance' ? play.event.type : undefined,
  };
};

export const getAllPlays = createSelector(
  getGameHistory,
  getPlayerGetter,
  getTeams,
  (history, playerGetter, teams): HalfInningPlaysGroup[] => {
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
      plays: plays.map(play => makeInterpolatedPlayDescription(play, playerGetter, teams)),
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

export const getLastPlay = createSelector(
  getGameHistory,
  getPlayerGetter,
  getTeams,
  (history, playerGetter, teams) => {
    const lastPlay = _.last(history);
    return lastPlay && makeInterpolatedPlayDescription(lastPlay, playerGetter, teams);
  }
);

export const getNextPlay = createSelector(getFuture, getPlayerGetter, (future, playerGetter) => {
  const nextState = _.first(future);
  const nextPlay = _.last(nextState?.gameHistory);
  return nextPlay && makeInterpolatedPlayDescription(nextPlay, playerGetter, nextState!.teams);
});
