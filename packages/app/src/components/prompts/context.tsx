import { createContext, useContext } from 'react';

import {
  ContactOptions,
  FielderOptions,
  OutOnPlayOptions,
  RunnerOptions,
} from 'state/prompts/types';

interface PromptContext {
  runnersScoredOptions?: number[];
  contactOptions?: ContactOptions;
  fielderOptions?: FielderOptions;
  outOnPlayOptions?: OutOnPlayOptions;
  runnerOptions?: RunnerOptions;
}

const promptContext = createContext<PromptContext>({});

export const PromptContextProvider = promptContext.Provider;
export const usePromptContext = () => useContext(promptContext);
