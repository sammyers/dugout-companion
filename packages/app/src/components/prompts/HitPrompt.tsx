import React, { FC, useMemo, useEffect } from 'react';
import { Box } from 'grommet';

import PromptStages from './PromptStages';
import { PromptContextProvider } from './context';

import { getSelectedContactOption } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

import { HitOptions, PromptUiStage } from 'state/prompts/types';

const HitPrompt: FC<HitOptions> = ({ contactOptions, runnerOptions, getNextOptions }) => {
  const dispatch = useAppDispatch();

  const selectedContactType = useAppSelector(getSelectedContactOption);

  const fielderOptions = useMemo(
    () => selectedContactType && getNextOptions(selectedContactType.contactType),
    [selectedContactType, getNextOptions]
  );

  useEffect(() => {
    const stages = [PromptUiStage.CONTACT];
    if (runnerOptions) {
      stages.push(PromptUiStage.RUNNERS);
    }
    stages.push(PromptUiStage.SUMMARY);
    dispatch(promptActions.setStages(stages));
  }, [runnerOptions, dispatch]);

  return (
    <Box gap="medium">
      <PromptContextProvider value={{ contactOptions, fielderOptions, runnerOptions }}>
        <PromptStages />
      </PromptContextProvider>
    </Box>
  );
};

export default HitPrompt;
