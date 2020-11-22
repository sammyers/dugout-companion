import React, { FC, useMemo, useCallback, useEffect } from 'react';
import { Box } from 'grommet';

import FielderPrompt from './FielderPrompt';
import OptionSelector from './OptionSelector';
import RunnerPrompt from './RunnerPrompt';

import { getSelectedSacFlyRunsScored } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppSelector, useAppDispatch } from 'utils/hooks';

import { SacrificeFlyOptions, BasePromptProps } from 'state/prompts/types';

const SacrificeFlyPrompt: FC<SacrificeFlyOptions & BasePromptProps> = ({
  fielderOptions,
  runnersScoredOptions,
  getNextOptions,
  setCanSubmit,
}) => {
  const dispatch = useAppDispatch();

  const selectedRunsScored = useAppSelector(getSelectedSacFlyRunsScored);

  useEffect(() => setCanSubmit(true), [setCanSubmit]);

  const runnerOptions = useMemo(() => getNextOptions?.(selectedRunsScored), [
    getNextOptions,
    selectedRunsScored,
  ]);

  const handleChangeRunsScored = useCallback(
    (value: number) => {
      dispatch(promptActions.setSacFlyRunsScoredChoice(value));
    },
    [dispatch]
  );

  return (
    <Box gap="medium">
      {runnersScoredOptions && (
        <OptionSelector
          options={runnersScoredOptions}
          value={selectedRunsScored}
          onChange={handleChangeRunsScored}
        />
      )}
      {fielderOptions && <FielderPrompt {...fielderOptions} />}
      {runnerOptions && <RunnerPrompt {...runnerOptions} />}
    </Box>
  );
};

export default SacrificeFlyPrompt;
