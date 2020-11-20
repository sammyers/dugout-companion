import { AppState } from 'state/store';

export const getSelectedRunnerOption = (state: AppState, runnerId: string) =>
  state.prompts.runnerChoices[runnerId];

export const getSelectedContactOption = (state: AppState) => state.prompts.contactChoice;
export const getSelectedFielderOption = (state: AppState) => state.prompts.fielderChoice;
export const getSelectedOutOnPlayOptions = (state: AppState) => state.prompts.outOnPlayChoices;

export const getSelectedSacFlyRunsScored = (state: AppState) =>
  state.prompts.sacFlyRunsScoredChoice;
