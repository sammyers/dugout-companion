import { FieldingPosition, HalfInning, PlateAppearanceType } from 'state/game/types';

export interface RawPlayDescription {
  description: string;
  playerIds: string[];
  position?: FieldingPosition;
  newNumOuts?: number;
  newScore?: [number, number];
}

export interface PlayDescription {
  description: string;
  outs?: number;
  score?: [number, number];
  type?: PlateAppearanceType;
}

export interface HalfInningPlaysGroup {
  inning: number;
  halfInning: HalfInning;
  plays: PlayDescription[];
}
