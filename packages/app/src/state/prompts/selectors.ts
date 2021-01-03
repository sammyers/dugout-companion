import { createNextState, createSelector } from '@reduxjs/toolkit';
import _ from 'lodash';

import {
  doesFieldingTeamHaveFourOutfielders,
  getCurrentBatter,
  getNumOuts,
  getPresent,
  getRunnerMap,
} from 'state/game/selectors';
import { applyPlateAppearance } from 'state/game/stateHelpers';
import { runnersToMap } from 'state/game/utils';
import {
  getExtraRunnerMovementForPlateAppearance,
  getPlateAppearanceDetailPrompt,
} from './prompts';

import { BaseType } from '@dugout-companion/shared';
import { PlateAppearance } from 'state/game/types';
import { AppState } from 'state/store';
import { BasepathOutcome } from './types';

export const getPlateAppearanceType = (state: AppState) => state.prompts.plateAppearanceType;

export const getPromptStages = (state: AppState) => state.prompts.stages;
export const getCurrentPromptStage = (state: AppState) => state.prompts.currentStage;

export const canMoveToNextStage = createSelector(
  getPromptStages,
  getCurrentPromptStage,
  (stages, currentStage) => {
    if (_.isUndefined(currentStage)) return false;
    const nextIndex = stages.findIndex(stage => stage > currentStage);
    return nextIndex > -1;
  }
);

export const canMoveToPreviousStage = createSelector(
  getPromptStages,
  getCurrentPromptStage,
  (stages, currentStage) => {
    if (!currentStage) return false;
    return stages.findIndex(stage => stage === currentStage) > 0;
  }
);

export const getSelectedRunner = (state: AppState) => state.prompts.selectedRunner;

const getAllRunnerPrompts = (state: AppState) => state.prompts.runnerPrompts;
const getSelectedRunnerPromptState = createSelector(
  getAllRunnerPrompts,
  getSelectedRunner,
  (prompts, runnerId) => (runnerId ? prompts[runnerId] : undefined)
);

const getForwardRunnerAdjacencies = (state: AppState) => state.prompts.runnerAdjacencies.forward;
const getBackwardRunnerAdjacencies = (state: AppState) => state.prompts.runnerAdjacencies.backward;
export const canSelectNextRunner = createSelector(
  getSelectedRunner,
  getForwardRunnerAdjacencies,
  (runnerId, adjacencies) => !!runnerId && runnerId in adjacencies
);
export const canSelectPreviousRunner = createSelector(
  getSelectedRunner,
  getBackwardRunnerAdjacencies,
  (runnerId, adjacencies) => !!runnerId && runnerId in adjacencies
);

export const getRunnerOptions = createSelector(
  getSelectedRunnerPromptState,
  promptState => promptState?.options
);
export const getCurrentSelectedRunnerOption = createSelector(
  getSelectedRunnerPromptState,
  getRunnerOptions,
  (promptState, options) => promptState && options![promptState.selected]
);
export const getSelectedBase = createSelector(
  getCurrentSelectedRunnerOption,
  option => option?.endBase
);

export const createSelectedRunnerOptionSelector = (runnerId: string) =>
  createSelector(getAllRunnerPrompts, prompts => {
    const prompt = prompts[runnerId];
    return prompt?.options?.[prompt?.selected];
  });

export const getGroupedRunnerOptions = createSelector(getRunnerOptions, options => {
  if (!options) return [];

  return options.reduce((groups, option) => {
    if (option.endBase !== _.last(groups)?.base) {
      groups.push({ base: option.endBase, options: [option] });
    } else {
      _.last(groups)!.options.push(option);
    }
    return groups;
  }, [] as { base: BaseType | null; options: BasepathOutcome[] }[]);
});

export const getSelectedContactOption = (state: AppState) => state.prompts.contactChoice;
export const getSelectedFielderOption = (state: AppState) => state.prompts.fielderChoice;
export const getSelectedOutOnPlayOptions = (state: AppState) => state.prompts.outOnPlayChoices;

export const getSelectedSacFlyRunsScored = (state: AppState) =>
  state.prompts.sacFlyRunsScoredChoice;

export const getAllRunnerChoices = (state: AppState) => state.prompts.runnerPrompts;

export const getPlateAppearanceResult = createSelector(
  getPlateAppearanceType,
  getSelectedContactOption,
  getSelectedFielderOption,
  getSelectedOutOnPlayOptions,
  getSelectedSacFlyRunsScored,
  getAllRunnerChoices,
  (type, contact, fielder, outsOnPlay, runsScoredOnSacFly, runnerChoices): PlateAppearance => ({
    type: type!,
    contact: contact?.contactType ?? null,
    fieldedBy: fielder?.position ?? null,
    outOnPlayRunners: outsOnPlay.map(runnerId => ({ runnerId })),
    runsScoredOnSacFly,
    basepathMovements: getExtraRunnerMovementForPlateAppearance(runnerChoices),
  })
);

export const getPlateAppearancePreview = createSelector(
  getPlateAppearanceResult,
  getPresent,
  (event, present) => {
    const { gameEventRecords, baseRunners, outs } = createNextState(present, state =>
      applyPlateAppearance(state, event)
    );
    const { scoredRunners } = _.last(gameEventRecords)!;
    return { runners: runnersToMap(baseRunners), scoredRunners, outs };
  }
);

export const getRunnerPromptBases = createSelector(
  getPlateAppearancePreview,
  ({ runners, scoredRunners }) => ({
    ...(_.invert(runners) as Record<string, BaseType>),
    ...scoredRunners.reduce(
      (all, { runnerId }) => ({ ...all, [runnerId]: null }),
      {} as Record<string, null>
    ),
  })
);

export const getOtherPromptBaserunners = createSelector(
  getRunnerPromptBases,
  getSelectedRunner,
  (runners, selectedRunner) =>
    _.pickBy(runners, (base, runnerId) => base && runnerId !== selectedRunner) as Record<
      string,
      BaseType
    >
);

export const getPrompt = createSelector(
  getPlateAppearanceType,
  getCurrentBatter,
  getNumOuts,
  getRunnerMap,
  doesFieldingTeamHaveFourOutfielders,
  (paType, batterId, outs, runners, fourOutfielders) =>
    getPlateAppearanceDetailPrompt(paType!, batterId!, outs, runners, fourOutfielders)
);
