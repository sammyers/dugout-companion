import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import _ from 'lodash';

import { gameActions } from 'state/game/slice';
import { getPlateAppearanceResult, getPlateAppearanceType } from './selectors';

import { PlateAppearanceType } from '@dugout-companion/shared';
import { AppDispatch, AppState } from 'state/store';

import {
  FielderOption,
  ContactOption,
  PromptUiStage,
  RunnerOptions,
  RunnerPromptState,
} from './types';

export interface PromptState {
  plateAppearanceType?: PlateAppearanceType;
  stages: PromptUiStage[];
  currentStage?: PromptUiStage;
  selectedRunner?: string;
  runnerAdjacencies: {
    forward: Record<string, string>;
    backward: Record<string, string>;
  };
  runnerPrompts: Record<string, RunnerPromptState>;
  contactChoice?: ContactOption;
  fielderChoice?: FielderOption;
  outOnPlayChoices: string[];
  sacFlyRunsScoredChoice: number;
}

const initialState: PromptState = {
  stages: [],
  runnerAdjacencies: {
    forward: {},
    backward: {},
  },
  runnerPrompts: {},
  outOnPlayChoices: [],
  sacFlyRunsScoredChoice: 1,
};

const { reducer, actions } = createSlice({
  name: 'prompt',
  initialState,
  reducers: {
    setPendingPlateAppearance(state, { payload }: PayloadAction<PlateAppearanceType>) {
      state.plateAppearanceType = payload;
    },
    clearPendingPlateAppearance(state) {
      delete state.plateAppearanceType;
    },
    setStages(state, { payload }: PayloadAction<PromptUiStage[]>) {
      state.stages = payload;
      if (!state.currentStage) {
        state.currentStage = payload[0];
      }
    },
    setCurrentStage(state, { payload }: PayloadAction<PromptUiStage>) {
      state.currentStage = payload;
    },
    goToNextStage(state) {
      if (!_.isUndefined(state.currentStage)) {
        const nextIndex = state.stages.findIndex(stage => stage > state.currentStage!);
        if (nextIndex > -1) {
          state.currentStage = state.stages[nextIndex];
        }
      }
    },
    goToPreviousStage(state) {
      if (state.currentStage) {
        const currentIndex = state.stages.findIndex(stage => stage === state.currentStage);
        if (currentIndex > 0) {
          state.currentStage = state.stages[currentIndex - 1];
        }
      }
    },
    linkNextRunner(state, { payload }: PayloadAction<{ current: string; previous: string }>) {
      state.runnerAdjacencies.forward[payload.previous] = payload.current;
      state.runnerAdjacencies.backward[payload.current] = payload.previous;
    },
    setSelectedRunner(state, { payload }: PayloadAction<string>) {
      state.selectedRunner = payload;
    },
    selectNextRunner(state) {
      if (state.selectedRunner) {
        const nextRunner = state.runnerAdjacencies.forward[state.selectedRunner];
        if (nextRunner) {
          state.selectedRunner = nextRunner;
        }
      }
    },
    selectPreviousRunner(state) {
      if (state.selectedRunner) {
        const previousRunner = state.runnerAdjacencies.backward[state.selectedRunner];
        if (previousRunner) {
          state.selectedRunner = previousRunner;
        }
      }
    },
    setRunnerOptions(state, { payload }: PayloadAction<RunnerOptions>) {
      state.runnerPrompts[payload.runnerId] = {
        options: payload.options,
        selected: payload.defaultOption,
      };
    },
    setRunnerChoice(state, { payload }: PayloadAction<{ runnerId: string; option: number }>) {
      state.runnerPrompts[payload.runnerId].selected = payload.option;
    },
    clearRunnerChoice(state, { payload }: PayloadAction<string>) {
      delete state.runnerPrompts[payload];
      const nextRunner = state.runnerAdjacencies.forward[payload];
      const previousRunner = state.runnerAdjacencies.backward[payload];
      delete state.runnerAdjacencies.forward[previousRunner];
      delete state.runnerAdjacencies.forward[payload];
      delete state.runnerAdjacencies.backward[nextRunner];
      delete state.runnerAdjacencies.backward[payload];
    },
    setContactChoice(state, { payload }: PayloadAction<ContactOption>) {
      state.contactChoice = payload;
    },
    clearContactChoice(state) {
      delete state.contactChoice;
    },
    setFielderChoice(state, { payload }: PayloadAction<FielderOption>) {
      state.fielderChoice = payload;
    },
    clearFielderChoice(state) {
      delete state.fielderChoice;
    },
    setOutOnPlayChoices(state, { payload }: PayloadAction<string[]>) {
      state.outOnPlayChoices = payload;
    },
    clearOutOnPlayChoices(state) {
      state.outOnPlayChoices = [];
    },
    setSacFlyRunsScoredChoice(state, { payload }: PayloadAction<number>) {
      state.sacFlyRunsScoredChoice = payload;
    },
    resetSacFlyRunsScoredChoice(state) {
      state.sacFlyRunsScoredChoice = 1;
    },
    clearPrompt: () => initialState,
  },
});

export const promptActions = {
  ...actions,
  submitPlateAppearance: () => (dispatch: AppDispatch, getState: () => AppState) => {
    const paType = getPlateAppearanceType(getState());
    if (paType) {
      dispatch(gameActions.recordPlateAppearance(getPlateAppearanceResult(getState())));
    }
    dispatch(actions.clearPendingPlateAppearance());
  },
};

export default reducer;
