export enum HalfInning {
  TOP,
  BOTTOM,
}
export enum TeamRole {
  AWAY,
  HOME,
}
export enum BaseType {
  FIRST = 'FIRST',
  SECOND = 'SECOND',
  THIRD = 'THIRD',
}
export enum FieldingPosition {
  PITCHER = 'PITCHER',
  CATCHER = 'CATCHER',
  FIRST_BASE = 'FIRST_BASE',
  SECOND_BASE = 'SECOND_BASE',
  THIRD_BASE = 'THIRD_BASE',
  SHORTSTOP = 'SHORTSTOP',
  LEFT_FIELD = 'LEFT_FIELD',
  CENTER_FIELD = 'CENTER_FIELD',
  LEFT_CENTER = 'LEFT_CENTER',
  RIGHT_CENTER = 'RIGHT_CENTER',
  RIGHT_FIELD = 'RIGHT_FIELD',
}
export enum PlateAppearanceType {
  OUT = 'OUT',
  WALK = 'WALK',
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  TRIPLE = 'TRIPLE',
  HOMERUN = 'HOMERUN',
  SACRIFICE_FLY = 'SACRIFICE_FLY',
  FIELDERS_CHOICE = 'FIELDERS_CHOICE',
  DOUBLE_PLAY = 'DOUBLE_PLAY',
}
export enum ContactType {
  NONE = 'NONE',
  GROUNDER = 'GROUNDER',
  LINE_DRIVE = 'LINE_DRIVE',
  POPUP = 'POPUP',
  LAZY_FLY = 'LAZY_FLY',
  LONG_FLY = 'LONG_FLY',
}
export type HitType = Exclude<
  PlateAppearanceType,
  | PlateAppearanceType.DOUBLE_PLAY
  | PlateAppearanceType.FIELDERS_CHOICE
  | PlateAppearanceType.OUT
  | PlateAppearanceType.SACRIFICE_FLY
  | PlateAppearanceType.WALK
>;
export type HitContactType = Exclude<ContactType, ContactType.NONE>;

export interface Team {
  name: string;
  lineup: string[];
  positions: {
    [playerId: string]: FieldingPosition;
  };
}

export type BaseRunners = Partial<Record<BaseType, string>>;

export interface PlateAppearanceResult {
  kind: 'plateAppearance';
  type: PlateAppearanceType;
  contactType?: ContactType;
  fieldedBy?: FieldingPosition;
  runnersOutOnPlay: string[];
  basesTaken: {
    [runnerId: string]: BaseType | null;
  };
  outsOnBasepaths: {
    [runnerId: string]: BaseType | null;
  };
  runsScoredOnSacFly?: number;
}

export interface StolenBaseAttempt {
  kind: 'stolenBaseAttempt';
  runnerId: string;
  success: boolean;
}

export type GameEvent = PlateAppearanceResult | StolenBaseAttempt;

export interface GameState {
  started: boolean;
  teams: [Team, Team];
  inning: number;
  halfInning: HalfInning;
  atBat?: string;
  upNextHalfInning?: string;
  runners: BaseRunners;
  outs: number;
  gameHistory: RecordedPlay[];
  score: [number, number];
}

export interface RecordedPlay {
  gameState: Required<
    Pick<GameState, 'atBat' | 'inning' | 'halfInning' | 'runners' | 'outs' | 'score'>
  >;
  event: GameEvent;
  runnersScored: string[];
  runnersBattedIn: string[];
  runnersAfter: BaseRunners;
  scoreAfter: [number, number];
}

export interface AddPlayerPayload {
  playerId: string;
  team: TeamRole;
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
