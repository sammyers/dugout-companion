import React, { FC, useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { createSelectedRunnerOptionSelector } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppSelector } from 'utils/hooks';

import { RunnerOptions } from 'state/prompts/types';

const RunnerPromptManager: FC<RunnerOptions> = ({
  runnerId,
  options,
  defaultOption,
  getTrailingRunnerOptions,
}) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(promptActions.setRunnerOptions({ runnerId, options, defaultOption }));
    return () => {
      dispatch(promptActions.clearRunnerChoice(runnerId));
    };
  }, [dispatch, runnerId, options, defaultOption]);

  const selectedOptionSelector = useMemo(() => createSelectedRunnerOptionSelector(runnerId), [
    runnerId,
  ]);
  const selectedOption = useAppSelector(selectedOptionSelector);

  const trailingRunnerOptions = useMemo(
    () => selectedOption && getTrailingRunnerOptions?.(selectedOption),
    [selectedOption, getTrailingRunnerOptions]
  );

  useEffect(() => {
    if (trailingRunnerOptions) {
      dispatch(
        promptActions.linkNextRunner({
          current: trailingRunnerOptions.runnerId,
          previous: runnerId,
        })
      );
    }
  }, [runnerId, trailingRunnerOptions, dispatch]);

  if (trailingRunnerOptions) {
    return <RunnerPromptManager {...trailingRunnerOptions} />;
  }

  return null;
};

export default RunnerPromptManager;
