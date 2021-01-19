import React, { useEffect } from 'react';
import _ from 'lodash';

import RunnerPromptManager from './RunnerPromptManager';

import { promptActions } from 'state/prompts/slice';
import { useAppDispatch } from 'utils/hooks';
import { usePromptContext } from './context';

const PromptStateManager = () => {
  const dispatch = useAppDispatch();

  const { outOnPlayOptions, runnerOptions } = usePromptContext();

  useEffect(() => {
    if (outOnPlayOptions) {
      const { multiple, runnerIds } = outOnPlayOptions;
      if (multiple) {
        dispatch(promptActions.setOutOnPlayChoices(runnerIds.slice(-2)));
      } else {
        dispatch(promptActions.setOutOnPlayChoices([_.last(runnerIds)!]));
      }
    }
  }, [outOnPlayOptions, dispatch]);

  useEffect(
    () => () => {
      dispatch(promptActions.clearContactChoice());
      dispatch(promptActions.clearFielderChoice());
      dispatch(promptActions.clearOutOnPlayChoices());
      dispatch(promptActions.resetSacFlyRunsScoredChoice());
    },
    [dispatch]
  );

  if (runnerOptions) {
    return <RunnerPromptManager {...runnerOptions} />;
  }

  return null;
};

export default PromptStateManager;
