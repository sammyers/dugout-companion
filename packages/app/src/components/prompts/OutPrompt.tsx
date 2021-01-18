import React, { FC, useMemo, useEffect } from 'react';
import { Box } from 'grommet';

import { PromptContextProvider } from './context';
import PromptStages from './PromptStages';

import { getSelectedContactOption } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

import { OutOptions, PromptUiStage } from 'state/prompts/types';

const OutPrompt: FC<OutOptions> = ({ contactOptions, getNextOptions }) => {
  const dispatch = useAppDispatch();

  const selectedContactType = useAppSelector(getSelectedContactOption);

  const { fielderOptions, runnerOptions } = useMemo(
    () => (selectedContactType && getNextOptions(selectedContactType.contactType)) ?? {},
    [selectedContactType, getNextOptions]
  );

  useEffect(() => {
    const stages = [PromptUiStage.CONTACT];
    if (runnerOptions) {
      stages.push(PromptUiStage.RUNNERS);
    }
    if (!!selectedContactType) {
      stages.push(PromptUiStage.SUMMARY);
    }
    dispatch(promptActions.setStages(stages));
  }, [runnerOptions, selectedContactType, dispatch]);

  return (
    <Box gap="medium">
      <PromptContextProvider value={{ contactOptions, fielderOptions, runnerOptions }}>
        <PromptStages />
      </PromptContextProvider>
    </Box>
  );
};

export default OutPrompt;
