import { ContactType, BaseType, FieldingPosition } from 'state/game/types';

export interface ContactOption {
  id: number;
  contactType: ContactType;
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
  getNextOptions: (contactType: ContactType) => FielderOptions | undefined;
}

export interface OutOptions {
  kind: 'out';
  contactOptions: ContactOptions;
  getNextOptions: (
    contactType: ContactType
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
    contactType: ContactType
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
