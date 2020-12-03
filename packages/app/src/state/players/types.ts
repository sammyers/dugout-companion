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

export interface NewPlayer {
  firstName: string;
  lastName: string;
}

export interface NewPlayerWithId extends NewPlayer {
  playerId: string;
}

export interface Player extends NewPlayerWithId {
  games: number;
  stats: PlayerStats;
}
