import React, { FC, useMemo, useEffect } from 'react';
import { Box } from 'grommet';

import { PromptContextProvider } from './context';
import PromptStages from './PromptStages';

import { getSelectedSacFlyRunsScored } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppSelector, useAppDispatch } from 'utils/hooks';

import { SacrificeFlyOptions, PromptUiStage } from 'state/prompts/types';

const SacrificeFlyPrompt: FC<SacrificeFlyOptions> = ({
  fielderOptions,
  runnersScoredOptions,
  getNextOptions,
}) => {
  const dispatch = useAppDispatch();

  const selectedRunsScored = useAppSelector(getSelectedSacFlyRunsScored);

  const runnerOptions = useMemo(() => getNextOptions?.(selectedRunsScored), [
    getNextOptions,
    selectedRunsScored,
  ]);

  useEffect(() => {
    const stages = [PromptUiStage.SAC_FLY_RBIS, PromptUiStage.CONTACT];
    if (runnerOptions) {
      stages.push(PromptUiStage.RUNNERS);
    }
    stages.push(PromptUiStage.SUMMARY);
    dispatch(promptActions.setStages(stages));
  }, [runnerOptions, dispatch]);

  return (
    <Box gap="medium">
      <PromptContextProvider value={{ runnersScoredOptions, fielderOptions, runnerOptions }}>
        <PromptStages />
      </PromptContextProvider>
    </Box>
  );
};

export default SacrificeFlyPrompt;
