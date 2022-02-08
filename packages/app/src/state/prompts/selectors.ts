import { createNextState, createSelector } from '@reduxjs/toolkit';
import _ from 'lodash';

import {
  getCurrentBatter,
  getNumOuts,
  getOccupiedFieldingPositions,
  getPresent,
  getRunnerMap,
} from 'state/game/selectors';
import { applyPlateAppearance } from 'state/game/stateHelpers';
import { getBaseForRunner, runnersToMap } from 'state/game/utils';
import {
  getExtraRunnerMovementForPlateAppearance,
  getPlateAppearanceDetailPrompt,
} from './prompts';

import { BaseType, ContactQuality, PlateAppearanceType } from '@sammyers/dc-shared';
import { PlateAppearance } from 'state/game/types';
import { AppState } from 'state/store';
import { BasepathOutcome } from './types';
import { getPlayerOptionsForSelector } from 'state/players/selectors';
import { formatShortBaseName } from 'utils/labels';

export const getCanSubmit = (state: AppState) => state.prompts.canSubmit;
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
    const { gameEventRecords, gameState } = createNextState(present, state =>
      applyPlateAppearance(state, event)
    );
    const { scoredRunners } = _.last(gameEventRecords)!;
    return { runners: runnersToMap(gameState!.baseRunners), scoredRunners, outs: gameState!.outs };
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
  getOccupiedFieldingPositions,
  (paType, batterId, outs, runners, fieldingPositions) =>
    getPlateAppearanceDetailPrompt(paType!, batterId!, outs, runners, fieldingPositions)
);

export const getAllRunnersOut = createSelector(
  getSelectedOutOnPlayOptions,
  getAllRunnerChoices,
  (outsOnPlay, runners) => {
    const runnersThrownOut = _.keys(
      _.pickBy(runners, ({ options, selected }) => {
        const selectedOption = options[selected];
        return selectedOption.attemptedAdvance && !selectedOption.successfulAdvance;
      })
    );
    return [...outsOnPlay, ...runnersThrownOut];
  }
);
export const getAllRunnersScored = createSelector(getPlateAppearancePreview, ({ scoredRunners }) =>
  scoredRunners.map(runner => runner.runnerId)
);

export const getDetailedOutOnPlayOptions = (state: AppState, runnerIds: string[]) => {
  const runnerMap = getRunnerMap(state);
  const options = getPlayerOptionsForSelector(state, runnerIds);

  return options.map(({ value, label }) => ({
    value,
    label,
    extra: _.includes(runnerMap, value)
      ? `Started at ${formatShortBaseName(getBaseForRunner(runnerMap, value))}`
      : 'Batter',
  }));
};

export const wasHitOverFence = createSelector(
  getPlateAppearanceType,
  getSelectedContactOption,
  (paType, contactOption) =>
    paType === PlateAppearanceType.HOMERUN ||
    contactOption?.contactType === ContactQuality.DEAD_BALL
);
