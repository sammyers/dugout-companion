import {
  ContactQuality,
  FieldingPosition,
  NewLineups_GameFragment,
  PlateAppearanceType,
  TeamRole,
  UnpackedGame_GameFragment,
} from '@dugout-companion/shared';

import { SimplifyType } from 'utils/common';

export type Game = SimplifyType<
  UnpackedGame_GameFragment,
  'gameEvent' | 'gameStateBefore' | 'gameStateAfter' | 'team'
>;
export type GameEventRecord = Game['gameEventRecords'][number];
export type Team = Game['teams'][number];
export type Lineup = Team['lineups'][number];
export type LineupSpot = Lineup['lineupSpots'][number];

export type GameEventContainer = GameEventRecord['gameEvent'];
export type PlateAppearance = NonNullable<GameEventContainer['plateAppearance']>;
export type LineupChange = NonNullable<GameEventContainer['lineupChange']>;
export type StolenBaseAttempt = NonNullable<GameEventContainer['stolenBaseAttempt']>;

export type HitType =
  | PlateAppearanceType.SINGLE
  | PlateAppearanceType.DOUBLE
  | PlateAppearanceType.TRIPLE
  | PlateAppearanceType.HOMERUN;
export type HitContactType = Exclude<ContactQuality, ContactQuality.NONE>;

export type GameState = GameEventRecord['gameStateBefore'];
export type BaseRunners = GameState['baseRunners'];
export type BaseRunnerMap = Partial<
  Record<BaseRunners[number]['base'], BaseRunners[number]['runnerId']>
>;
export type ScoredRunner = GameEventRecord['scoredRunners'][number];
export type BasepathMovement = PlateAppearance['basepathMovements'][number];

export enum GameStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

export type AppGameState = SimplifyType<
  GameState &
    Pick<Game, 'gameLength' | 'teams' | 'gameEventRecords'> & {
      status: GameStatus;
      upNextHalfInning?: string;
      nextLineupId: number;
    }
>;

export type CreatedLineups = SimplifyType<NewLineups_GameFragment, 'originalClientId'>;

export interface AddPlayerPayload {
  playerId: string;
  teamRole: TeamRole;
}

export interface MovePlayerPayload {
  startIndex: number;
  endIndex: number;
  fromTeam: TeamRole;
  toTeam: TeamRole;
}
export interface ChangePlayerPositionPayload {
  playerId: string;
  position: FieldingPosition;
}
