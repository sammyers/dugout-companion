import React, { useCallback } from 'react';
import { Box, Heading } from 'grommet';

import OptionSelector from '../OptionSelector';

import { getSelectedSacFlyRunsScored } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import { usePromptContext } from '../context';

const SacFlyRbiPrompt = () => {
  const dispatch = useAppDispatch();

  const selectedRunsScored = useAppSelector(getSelectedSacFlyRunsScored);

  const { runnersScoredOptions } = usePromptContext();

  const handleChangeRunsScored = useCallback(
    (value: number) => {
      dispatch(promptActions.setSacFlyRunsScoredChoice(value));
    },
    [dispatch]
  );

  if (!runnersScoredOptions) return null;

  return (
    <Box gap="xsmall" flex>
      <Heading level={4} margin="none" alignSelf="center">
        Runs batted in
      </Heading>
      <OptionSelector
        options={runnersScoredOptions}
        value={selectedRunsScored}
        onChange={handleChangeRunsScored}
      />
    </Box>
  );
};

export default SacFlyRbiPrompt;
