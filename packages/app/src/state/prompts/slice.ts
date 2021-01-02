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
  runnerPrompts: Record<string, RunnerPromptState>;
  contactChoice?: ContactOption;
  fielderChoice?: FielderOption;
  outOnPlayChoices: string[];
  sacFlyRunsScoredChoice: number;
}

const initialState: PromptState = {
  stages: [],
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
    setSelectedRunner(state, { payload }: PayloadAction<string>) {
      state.selectedRunner = payload;
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
