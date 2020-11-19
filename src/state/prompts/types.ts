import { ContactType, BaseType, FieldingPosition } from 'state/game/types';

interface ContactOption {
  contactType: ContactType;
  label: string;
}
interface ContactOptions {
  options: ContactOption[];
  required?: boolean;
}
export type BasepathOutcome =
  | { attemptedAdvance: false }
  | {
      attemptedAdvance: true;
      endBase: BaseType | null;
      successfulAdvance: boolean;
    };
export interface RunnerOptions {
  runnerId: string;
  options: BasepathOutcome[];
  getTrailingRunnerOptions?: (outcome: BasepathOutcome) => RunnerOptions | undefined;
}
interface FielderOption {
  position: FieldingPosition;
  label: string;
}
export interface FielderOptions {
  options: FielderOption[];
  multiple?: boolean;
}
interface OutOnPlayOptions {
  runnerIds: string[];
  multiple?: boolean;
}

export interface HitPrompt {
  kind: 'hit';
  contactOptions: ContactOptions;
  runnerOptions?: RunnerOptions;
  getNextPrompt: (contactType: ContactType) => FielderOptions | undefined;
}

export interface OutPrompt {
  kind: 'out';
  contactOptions: ContactOptions;
  getNextPrompt: (
    contactType: ContactType
  ) =>
    | {
        runnerOptions?: RunnerOptions;
        fielderOptions?: FielderOptions;
      }
    | undefined;
}

export interface SacrificeFlyPrompt {
  kind: 'sacrificeFly';
  fielderOptions: FielderOptions;
  runnersScoredOptions?: number[];
  getNextPrompt?: (numScored: number) => RunnerOptions | undefined;
}

export interface FieldersChoicePrompt {
  kind: 'fieldersChoice';
  fielderOptions: FielderOptions;
  outOnPlayOptions: OutOnPlayOptions;
  getNextPrompt?: (runnerOut: string) => RunnerOptions | undefined;
}

export interface DoublePlayPrompt {
  kind: 'doublePlay';
  contactOptions: ContactOptions;
  getNextPrompt: (
    contactType: ContactType
  ) => {
    fielderOptions: FielderOptions;
    outOnPlayOptions?: OutOnPlayOptions;
    getNextPrompt?: (runnersOut: string[]) => RunnerOptions | undefined;
  };
}

export type PlateAppearanceDetailPrompt =
  | OutPrompt
  | HitPrompt
  | SacrificeFlyPrompt
  | FieldersChoicePrompt
  | DoublePlayPrompt;
