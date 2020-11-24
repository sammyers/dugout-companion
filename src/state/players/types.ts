export interface PlayerStats {
  atBats: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  walks: number;
  stolenBases: number;
  runsBattedIn: number;
  runsScored: number;
  strikeouts: number;
  sacrificeFlies: number;
  battingAverage?: number;
  onBasePercentage?: number;
  sluggingPercentage?: number;
  onBasePlusSlugging?: number;
  isolatedPower?: number;
}

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
