import React, { FC, useMemo, useEffect } from 'react';
import { Box } from 'grommet';

import { PromptContextProvider } from './context';
import PromptStages from './PromptStages';

import { getSelectedOutOnPlayOptions } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import { shouldShowOOPPrompt } from './panels/OutOnPlayPrompt';

import { FieldersChoiceOptions, PromptUiStage } from 'state/prompts/types';

const FieldersChoicePrompt: FC<FieldersChoiceOptions> = ({
  fielderOptions,
  outOnPlayOptions,
  getNextOptions,
}) => {
  const dispatch = useAppDispatch();

  const [selectedOutOnPlay] = useAppSelector(getSelectedOutOnPlayOptions);

  const canSubmit = outOnPlayOptions.runnerIds.length > 1 ? !!selectedOutOnPlay : true;

  const runnerOptions = useMemo(
    () => (selectedOutOnPlay && getNextOptions?.(selectedOutOnPlay)) || undefined,
    [getNextOptions, selectedOutOnPlay]
  );

  useEffect(() => {
    const stages = [PromptUiStage.CONTACT];
    if (shouldShowOOPPrompt(outOnPlayOptions)) {
      stages.push(PromptUiStage.OUTS_ON_PLAY);
    }
    if (runnerOptions) {
      stages.push(PromptUiStage.RUNNERS);
    }
    if (canSubmit) {
      stages.push(PromptUiStage.SUMMARY);
    }
    dispatch(promptActions.setStages(stages));
  }, [outOnPlayOptions, runnerOptions, canSubmit, dispatch]);

  return (
    <Box gap="medium" margin={{ top: 'small' }}>
      <PromptContextProvider value={{ fielderOptions, outOnPlayOptions, runnerOptions }}>
        <PromptStages />
      </PromptContextProvider>
    </Box>
  );
};

export default FieldersChoicePrompt;
