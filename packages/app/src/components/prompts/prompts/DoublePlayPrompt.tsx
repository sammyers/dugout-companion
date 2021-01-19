import React, { FC, useMemo, useEffect } from 'react';
import { Box } from 'grommet';

import { PromptContextProvider } from '../context';
import PromptStages from '../PromptStages';

import { getSelectedOutOnPlayOptions, getSelectedContactOption } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import { shouldShowOOPPrompt } from '../panels/OutOnPlayPanel';

import { DoublePlayOptions, PromptUiStage } from 'state/prompts/types';

const DoublePlayPrompt: FC<DoublePlayOptions> = ({ contactOptions, getNextOptions }) => {
  const dispatch = useAppDispatch();

  const selectedContactType = useAppSelector(getSelectedContactOption);
  const selectedOutsOnPlay = useAppSelector(getSelectedOutOnPlayOptions);

  const nextOptions = useMemo(
    () => selectedContactType && getNextOptions(selectedContactType.contactType),
    [getNextOptions, selectedContactType]
  );

  const outsOnPlayFulfilled =
    !!nextOptions &&
    (!nextOptions.outOnPlayOptions ||
      selectedOutsOnPlay.length === (nextOptions.outOnPlayOptions.multiple ? 2 : 1));
  const canSubmit = !!selectedContactType && outsOnPlayFulfilled;

  useEffect(() => {
    dispatch(promptActions.setCanSubmit(canSubmit));
  }, [dispatch, canSubmit]);

  const runnerOptions = useMemo(
    () =>
      (nextOptions &&
        !!selectedOutsOnPlay.length &&
        nextOptions.getNextOptions?.(selectedOutsOnPlay)) ||
      undefined,
    [nextOptions, selectedOutsOnPlay]
  );

  useEffect(() => {
    const stages = [PromptUiStage.CONTACT];
    if (nextOptions?.outOnPlayOptions && shouldShowOOPPrompt(nextOptions.outOnPlayOptions)) {
      stages.push(PromptUiStage.OUTS_ON_PLAY);
    }
    if (runnerOptions) {
      stages.push(PromptUiStage.RUNNERS);
    }
    dispatch(promptActions.setStages(stages));
  }, [nextOptions, runnerOptions, canSubmit, dispatch]);

  return (
    <Box gap="medium">
      <PromptContextProvider
        value={{
          contactOptions,
          fielderOptions: nextOptions?.fielderOptions,
          outOnPlayOptions: nextOptions?.outOnPlayOptions,
          runnerOptions,
        }}
      >
        <PromptStages />
      </PromptContextProvider>
    </Box>
  );
};

export default DoublePlayPrompt;
