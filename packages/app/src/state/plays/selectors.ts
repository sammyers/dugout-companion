import { createSelector } from '@reduxjs/toolkit';
import _ from 'lodash';

import { getFuture, getGameHistory, getGameStateGetter, getTeams } from 'state/game/selectors';
import { getTeamWithRole } from 'state/game/utils';
import { getPlayerGetter } from 'state/players/selectors';
import { formatShortName } from 'state/players/utils';
import { getPlayDescription } from './plays';

import { GameEventRecord, GameState, Team } from 'state/game/types';
import { Player } from 'state/players/types';
import { HalfInningPlaysGroup, PlayDescription } from './types';
import { FieldingPosition, HalfInning, TeamRole } from '@sammyers/dc-shared';

const getPlayerAtPosition = (team: Team, position: FieldingPosition, lineupId: string) => {
  const { lineupSpots } = team.lineups.find(lineup => lineup.id === lineupId)!;
  return lineupSpots.find(spot => spot.position === position)!.playerId;
};

const makeInterpolatedPlayDescription = (
  play: GameEventRecord,
  playerGetter: (playerId: string) => Player,
  gameStateGetter: (gameStateId: string) => GameState,
  teams: Team[]
): PlayDescription => {
  const gameStateBefore = gameStateGetter(play.gameStateBeforeId);
  const gameStateAfter = gameStateGetter(play.gameStateAfterId);
  const { description, playerIds, position, newNumOuts, newScore } = getPlayDescription(
    play,
    gameStateBefore,
    gameStateAfter
  );
  let interpolatedDescription = description;
  if (position) {
    const teamRole =
      gameStateBefore.halfInning === HalfInning.BOTTOM ? TeamRole.AWAY : TeamRole.HOME;
    const team = getTeamWithRole(teams, teamRole);
    const { id: lineupId } = gameStateBefore.lineups!.find(
      lineup => lineup.team.role === teamRole
    )!;
    interpolatedDescription = description.replace(
      new RegExp(`{${position}}`),
      formatShortName(playerGetter(getPlayerAtPosition(team, position, lineupId)))
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
    type: play.gameEvent.plateAppearance ? play.gameEvent.plateAppearance.type : undefined,
  };
};

export const getAllPlays = createSelector(
  getGameHistory,
  getPlayerGetter,
  getGameStateGetter,
  getTeams,
  (history, playerGetter, gameStateGetter, teams): HalfInningPlaysGroup[] => {
    const groupedPlaysByInning = history.reduce((groupedPlays, play) => {
      const gameStateBefore = gameStateGetter(play.gameStateBeforeId);
      const { inning, halfInning } = gameStateBefore;
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
    }, [] as { inning: number; halfInning: HalfInning; plays: GameEventRecord[] }[]);

    return groupedPlaysByInning.map(({ inning, halfInning, plays }) => ({
      inning,
      halfInning,
      plays: plays
        .filter(play => !play.gameEvent.lineupChange)
        .map(play => makeInterpolatedPlayDescription(play, playerGetter, gameStateGetter, teams)),
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
  getGameStateGetter,
  getTeams,
  (history, playerGetter, gameStateGetter, teams) => {
    const lastPlay = _.last(history);
    return (
      lastPlay && makeInterpolatedPlayDescription(lastPlay, playerGetter, gameStateGetter, teams)
    );
  }
);

export const getNextPlay = createSelector(
  getFuture,
  getPlayerGetter,
  getGameStateGetter,
  (future, playerGetter, gameStateGetter) => {
    const nextState = _.first(future);
    const nextPlay = _.last(nextState?.gameEventRecords);
    return (
      nextPlay &&
      makeInterpolatedPlayDescription(nextPlay, playerGetter, gameStateGetter, nextState!.teams)
    );
  }
);
