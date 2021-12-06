import { GetAllPlayersQuery, SimplifyType } from '@sammyers/dc-shared';

export interface CountingStats {
  atBats: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  walks: number;
  stolenBases: number;
  caughtStealing: number;
  runsBattedIn: number;
  runsScored: number;
  strikeouts: number;
  sacrificeFlies: number;
  groundIntoDoublePlays: number;
  leftOnBase: number;
}

export interface RateStats {
  battingAverage: number;
  onBasePercentage: number;
  sluggingPercentage: number;
  onBasePlusSlugging: number;
  isolatedPower: number;
}

export type PlayerStats = CountingStats & Partial<RateStats>;

export type Player = NonNullable<SimplifyType<GetAllPlayersQuery>['players']>[number];

export type NewPlayer = Omit<Player, 'id'>;
