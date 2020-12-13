import { createNextState } from '@reduxjs/toolkit';
import _ from 'lodash';

import { getPresent } from 'state/game/selectors';
import { runnersToMap } from 'state/game/utils';
import { getExtraRunnerMovementForPlateAppearance } from './prompts';

import { PlateAppearanceType } from '@dugout-companion/shared';
import { PlateAppearance } from 'state/game/types';
import { AppState } from 'state/store';
import { applyPlateAppearance } from 'state/game/slice';

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
): PlateAppearance => ({
  type,
  contact: getSelectedContactOption(state)?.contactType ?? null,
  fieldedBy: getSelectedFielderOption(state)?.position ?? null,
  outOnPlayRunners: getSelectedOutOnPlayOptions(state).map(runnerId => ({ runnerId })),
  runsScoredOnSacFly: getSelectedSacFlyRunsScored(state),
  basepathMovements: getExtraRunnerMovementForPlateAppearance(getAllRunnerChoices(state)),
});

export const getPlateAppearancePreview = (state: AppState, type: PlateAppearanceType) => {
  const event = getPlateAppearanceResult(state, type);
  const { gameEventRecords, baseRunners, outs } = createNextState(getPresent(state), state =>
    applyPlateAppearance(state, event)
  );
  const { scoredRunners } = _.last(gameEventRecords)!;
  return { runners: runnersToMap(baseRunners), scoredRunners, outs };
};
