import { BaseType, ContactQuality, FieldingPosition } from '@dugout-companion/shared';

export interface ContactOption {
  id: number;
  contactType: ContactQuality;
  label: string;
}
export interface ContactOptions {
  options: ContactOption[];
  required?: boolean;
}
export type BasepathOutcome = { id: number } & (
  | { attemptedAdvance: false; endBase: BaseType }
  | {
      attemptedAdvance: true;
      endBase: BaseType | null;
      successfulAdvance: boolean;
    }
);
export interface RunnerOptions {
  runnerId: string;
  options: BasepathOutcome[];
  defaultOption: number;
  getTrailingRunnerOptions?: (outcome: BasepathOutcome) => RunnerOptions | undefined;
}
export interface FielderOption {
  id: number;
  position: FieldingPosition;
  label: string;
}
export interface FielderOptions {
  options: FielderOption[];
  multiple?: boolean;
}
export interface OutOnPlayOptions {
  runnerIds: string[];
  multiple?: boolean;
}

export interface HitOptions {
  kind: 'hit';
  contactOptions: ContactOptions;
  runnerOptions?: RunnerOptions;
  getNextOptions: (contactType: ContactQuality) => FielderOptions | undefined;
}

export interface OutOptions {
  kind: 'out';
  contactOptions: ContactOptions;
  getNextOptions: (
    contactType: ContactQuality
  ) =>
    | {
        runnerOptions?: RunnerOptions;
        fielderOptions?: FielderOptions;
      }
    | undefined;
}

export interface SacrificeFlyOptions {
  kind: 'sacrificeFly';
  fielderOptions: FielderOptions;
  runnersScoredOptions?: number[];
  getNextOptions?: (numScored: number) => RunnerOptions | undefined;
}

export interface FieldersChoiceOptions {
  kind: 'fieldersChoice';
  fielderOptions: FielderOptions;
  outOnPlayOptions: OutOnPlayOptions;
  getNextOptions?: (runnerOut: string) => RunnerOptions | undefined;
}

export interface DoublePlayOptions {
  kind: 'doublePlay';
  contactOptions: ContactOptions;
  getNextOptions: (
    contactType: ContactQuality
  ) => {
    fielderOptions: FielderOptions;
    outOnPlayOptions?: OutOnPlayOptions;
    getNextOptions?: (runnersOut: string[]) => RunnerOptions | undefined;
  };
}

export type PlateAppearanceDetailOptions =
  | OutOptions
  | HitOptions
  | SacrificeFlyOptions
  | FieldersChoiceOptions
  | DoublePlayOptions;

export interface BasePromptProps {
  setCanSubmit: (value: boolean) => void;
}

export enum PromptUiStage {
  SAC_FLY_RBIS,
  CONTACT,
  OUTS_ON_PLAY,
  RUNNERS,
}

export interface RunnerPromptState {
  options: BasepathOutcome[];
  selected: number;
}
