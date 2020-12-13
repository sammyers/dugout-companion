import { FieldingPosition, HalfInning, PlateAppearanceType } from '@dugout-companion/shared';

export interface RawPlayDescription {
  description: string;
  playerIds: string[];
  position?: FieldingPosition;
  newNumOuts?: number;
  newScore?: number[];
}

export interface PlayDescription {
  description: string;
  outs?: number;
  score?: number[];
  type?: PlateAppearanceType;
}

export interface HalfInningPlaysGroup {
  inning: number;
  halfInning: HalfInning;
  plays: PlayDescription[];
}
