import { AppState } from 'state/store';
import { PlateAppearanceType, PlateAppearanceResult } from 'state/game/types';
import { getExtraRunnerMovementForPlateAppearance } from './prompts';

export const getSelectedRunnerOption = (state: AppState, runnerId: string) =>
  state.prompts.runnerChoices[runnerId];

export const getSelectedContactOption = (state: AppState) => state.prompts.contactChoice;
export const getSelectedFielderOption = (state: AppState) => state.prompts.fielderChoice;
export const getSelectedOutOnPlayOptions = (state: AppState) => state.prompts.outOnPlayChoices;

export const getSelectedSacFlyRunsScored = (state: AppState) =>
  state.prompts.sacFlyRunsScoredChoice;

export const getAllRunnerChoices = (state: AppState) => state.prompts.runnerChoices;

export const getPlateAppearanceResult = (
  state: AppState,
  type: PlateAppearanceType
): PlateAppearanceResult => ({
  kind: 'plateAppearance',
  type,
  contactType: getSelectedContactOption(state)?.contactType,
  fieldedBy: getSelectedFielderOption(state)?.position,
  runnersOutOnPlay: getSelectedOutOnPlayOptions(state),
  ...getExtraRunnerMovementForPlateAppearance(getAllRunnerChoices(state)),
});
