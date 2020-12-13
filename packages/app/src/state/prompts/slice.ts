import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { BasepathOutcome, FielderOption, ContactOption } from './types';

export interface PromptState {
  runnerChoices: Record<string, BasepathOutcome>;
  contactChoice?: ContactOption;
  fielderChoice?: FielderOption;
  outOnPlayChoices: string[];
  sacFlyRunsScoredChoice: number;
}

const initialState: PromptState = {
  runnerChoices: {},
  outOnPlayChoices: [],
  sacFlyRunsScoredChoice: 1,
};

const { reducer, actions: promptActions } = createSlice({
  name: 'prompt',
  initialState,
  reducers: {
    setRunnerChoice(
      state,
      { payload }: PayloadAction<{ runnerId: string; option: BasepathOutcome }>
    ) {
      state.runnerChoices[payload.runnerId] = payload.option;
    },
    clearRunnerChoice(state, { payload }: PayloadAction<string>) {
      delete state.runnerChoices[payload];
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

export default reducer;
export { promptActions };
