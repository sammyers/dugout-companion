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
  RIGHT_FIELD = 'RIGHT_FIELD',
  LEFT_CENTER = 'LEFT_CENTER',
  RIGHT_CENTER = 'RIGHT_CENTER',
}
export enum PlateAppearanceType {
  OUT = 'OUT',
  SINGLE = 'SINGLE',
  DOUBLE = 'DOUBLE',
  TRIPLE = 'TRIPLE',
  HOMERUN = 'HOMERUN',
  WALK = 'WALK',
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
  extraBasesTaken: {
    [runnerId: string]: number;
  };
  extraOutsOnBasepaths: {
    [runnerId: string]: BaseType;
  };
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
  gameHistory: GameEvent[];
  score: [number, number];
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

interface ContactOption {
  contactType: ContactType;
  label: string;
}
interface BasepathOutcome {
  endBase: BaseType | null;
  successfulAdvance: boolean;
}
interface RunnerOptions {
  runnerId: string;
  options: BasepathOutcome[];
}
interface OutOnPlayOptions {
  runnerIds: string[];
  multiple: boolean;
}

export interface OutPrompt {
  kind: 'out';
  contactOptions: ContactOption[];
  getRunnerOptions: (contactType: ContactType) => RunnerOptions;
}

export interface HitPrompt {
  kind: 'hit';
  contactOptions: ContactOption[];
  runnerOptions: RunnerOptions[];
}

export interface SacrificeFlyPrompt {
  kind: 'sacrificeFly';
  runnersScoredOptions: number[];
  getAdditionalRunnerOptions: (runnersScored: number) => RunnerOptions[];
}

export interface FieldersChoicePrompt {
  kind: 'fieldersChoice';
  outOnPlayOptions: OutOnPlayOptions;
  getAdditionalRunnerOptions: (runnerOut: string) => RunnerOptions[];
}

export interface DoublePlayPrompt {
  kind: 'doublePlay';
  outOnPlayOptions: OutOnPlayOptions;
  getAdditionalRunnerOptions: (runnersOut: string[]) => RunnerOptions[];
}

export type PlateAppearanceDetailPrompt =
  | OutPrompt
  | HitPrompt
  | SacrificeFlyPrompt
  | FieldersChoicePrompt
  | DoublePlayPrompt;
