import {
  ContactQuality,
  FieldingPosition,
  Maybe,
  PlateAppearanceType,
  SimplifyType,
  TeamRole,
  UnpackedGame_GameFragment,
} from '@sammyers/dc-shared';

export type Game = SimplifyType<
  UnpackedGame_GameFragment,
  'gameEvent' | 'gameStateBefore' | 'gameStateAfter' | 'team'
>;
export type GameEventRecord = Game['gameEventRecords'][number];
export type GameState = Game['gameStates'][number];
export type Team = Game['teams'][number];
export type Lineup = Team['lineups'][number];
export type LineupSpot = Lineup['lineupSpots'][number];

export type GameEventContainer = GameEventRecord['gameEvent'];
export type PlateAppearance = NonNullable<GameEventContainer['plateAppearance']>;
export type LineupChange = NonNullable<GameEventContainer['lineupChange']>;
export type StolenBaseAttempt = NonNullable<GameEventContainer['stolenBaseAttempt']>;
export type SoloModeInning = NonNullable<GameEventContainer['soloModeOpponentInning']>;
export type AtBatSkip = NonNullable<GameEventContainer['atBatSkip']>;

export type HitType =
  | PlateAppearanceType.SINGLE
  | PlateAppearanceType.DOUBLE
  | PlateAppearanceType.TRIPLE
  | PlateAppearanceType.HOMERUN;
export type HitContactType = Exclude<ContactQuality, ContactQuality.NONE>;

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

export type AppGameState = Pick<Game, 'gameLength' | 'teams' | 'gameEventRecords' | 'name'> & {
  gameId?: string;
  timeStarted?: string;
  timeEnded?: string;
  gameState?: GameState;
  prevGameStates: GameState[];
  status: GameStatus;
  upNextHalfInning?: string;
  editingLineups: boolean;
  lineupDrafts: Record<TeamRole, LineupSpot[]>;
  saved: boolean;
  soloMode: boolean;
  soloModeOpponentPositions: FieldingPosition[];
  soloModeOpponentBatterId: string;
  allowSteals: boolean;
  allowTies: boolean;
  inningEndingDBOs: boolean;
  gameTimeExpired: boolean;
};

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
  position: FieldingPosition | null;
}

export interface ChangePositionsCurrentPayload {
  newPositions: Record<string, Maybe<FieldingPosition>>;
  role: TeamRole;
}
