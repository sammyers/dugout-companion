import React, { FC, useMemo, useEffect } from 'react';
import { Box } from 'grommet';

import { getSelectedContactOption } from 'state/prompts/selectors';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

import { HitOptions, BasePromptProps, PromptUiStage } from 'state/prompts/types';
import { promptActions } from 'state/prompts/slice';
import { PromptContextProvider } from './context';
import PromptStages from './PromptStages';

const HitPrompt: FC<HitOptions & BasePromptProps> = ({
  contactOptions,
  runnerOptions,
  getNextOptions,
  setCanSubmit,
}) => {
  const dispatch = useAppDispatch();

  useEffect(() => setCanSubmit(true), [setCanSubmit]);

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
