import { CountingStats, RateStats } from 'state/players/types';

export interface BoxScoreRow extends CountingStats, Record<keyof RateStats, string> {
  playerId: string;
  lineupSpot: number;
}
