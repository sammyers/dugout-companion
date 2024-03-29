import { ContactQuality, PlateAppearanceType } from '@sammyers/dc-shared';
import _ from 'lodash';

import { GameEventRecord, GameState } from 'state/game/types';
import { PlayerStats } from 'state/players/types';

export const initialStats: PlayerStats = {
  atBats: 0,
  hits: 0,
  doubles: 0,
  triples: 0,
  homeRuns: 0,
  walks: 0,
  stolenBases: 0,
  caughtStealing: 0,
  runsBattedIn: 0,
  runsScored: 0,
  strikeouts: 0,
  sacrificeFlies: 0,
  groundIntoDoublePlays: 0,
  leftOnBase: 0,
};

export const aggregateStats = (
  plays: GameEventRecord[],
  gameStateGetter: (gameStateId: string) => GameState
) => {
  const allStats: Record<string, PlayerStats> = {};
  const updatePlayer = (playerId: string, callback: (stats: PlayerStats) => void) => {
    if (!(playerId in allStats)) {
      allStats[playerId] = { ...initialStats };
    }
    callback(allStats[playerId]);
  };
  plays.forEach(({ gameStateBeforeId, gameEvent, scoredRunners }) => {
    scoredRunners.forEach(({ runnerId }) => {
      updatePlayer(runnerId, stats => void stats.runsScored++);
    });
    if (gameEvent.stolenBaseAttempt) {
      const { runnerId, success } = gameEvent.stolenBaseAttempt;
      updatePlayer(runnerId, stats => {
        if (success) {
          stats.stolenBases++;
        } else {
          stats.caughtStealing++;
        }
      });
    } else if (gameEvent.plateAppearance) {
      const gameStateBefore = gameStateGetter(gameStateBeforeId);
      updatePlayer(gameStateBefore.playerAtBat, stats => {
        stats.runsBattedIn += _.filter(scoredRunners, { battedIn: true }).length;
        const { type, contact } = gameEvent.plateAppearance!;

        if (type === PlateAppearanceType.WALK) {
          stats.walks++;
        } else if (type === PlateAppearanceType.SACRIFICE_FLY) {
          stats.sacrificeFlies++;
        } else {
          stats.atBats++;
          switch (type) {
            case PlateAppearanceType.SINGLE:
              stats.hits++;
              break;
            case PlateAppearanceType.DOUBLE:
              stats.hits++;
              stats.doubles++;
              break;
            case PlateAppearanceType.TRIPLE:
              stats.hits++;
              stats.triples++;
              break;
            case PlateAppearanceType.HOMERUN:
              stats.hits++;
              stats.homeRuns++;
              break;
            case PlateAppearanceType.OUT:
              if (contact === ContactQuality.NONE) {
                stats.strikeouts++;
              }
              stats.leftOnBase += gameStateBefore.baseRunners.length;
              break;
            case PlateAppearanceType.DOUBLE_PLAY:
              if (contact === ContactQuality.GROUNDER) {
                stats.groundIntoDoublePlays++;
              }
              stats.leftOnBase += gameStateBefore.baseRunners.length - 1;
              break;
            case PlateAppearanceType.FIELDERS_CHOICE:
              stats.leftOnBase += gameStateBefore.baseRunners.length;
              break;
          }
        }
      });
    }
  });
  return allStats;
};

export const getRateStats = (
  stats: PlayerStats
): Required<
  Pick<
    PlayerStats,
    | 'battingAverage'
    | 'onBasePercentage'
    | 'sluggingPercentage'
    | 'isolatedPower'
    | 'onBasePlusSlugging'
  >
> => {
  const battingAverage = stats.hits / stats.atBats;
  const onBasePercentage =
    (stats.hits + stats.walks) / (stats.atBats + stats.walks + stats.sacrificeFlies);
  const sluggingPercentage =
    (stats.hits + stats.doubles + 2 * stats.triples + 3 * stats.homeRuns) / stats.atBats;
  return {
    battingAverage,
    onBasePercentage,
    sluggingPercentage,
    onBasePlusSlugging: onBasePercentage + sluggingPercentage,
    isolatedPower: sluggingPercentage - battingAverage,
  };
};

export const formatDecimal = (val: number) => {
  const formatted = val.toFixed(3);
  return val >= 1 ? formatted : formatted.slice(1);
};
