import React, { FC, useMemo, useCallback, useEffect } from 'react';
import { Box, Text } from 'grommet';
import { useDispatch } from 'react-redux';

import OptionSelector from '../OptionSelector';

import { getShortPlayerName } from 'state/players/selectors';
import { getSelectedRunnerOption } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppSelector } from 'utils/hooks';
import { getRunnerOptionLabel } from 'utils/labels';

import { RunnerOptions } from 'state/prompts/types';

const RunnerPrompt: FC<RunnerOptions> = ({
  runnerId,
  options,
  defaultOption,
  getTrailingRunnerOptions,
}) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(promptActions.setRunnerChoice({ runnerId, option: options[defaultOption] }));
    return () => {
      dispatch(promptActions.clearRunnerChoice(runnerId));
    };
  }, [dispatch, runnerId, options, defaultOption]);

  const selectedOption = useAppSelector(state => getSelectedRunnerOption(state, runnerId));
  const runnerName = useAppSelector(state => getShortPlayerName(state, runnerId));

  const formattedOptions = useMemo(
    () =>
      options.map(option => ({
        label: getRunnerOptionLabel(option),
        value: option.id,
        negative: option.attemptedAdvance && !option.successfulAdvance,
      })),
    [options]
  );

  const trailingRunnerOptions = useMemo(
    () => selectedOption && getTrailingRunnerOptions?.(selectedOption),
    [selectedOption, getTrailingRunnerOptions]
  );

  const handleChange = useCallback(
    (value: number) =>
      dispatch(promptActions.setRunnerChoice({ runnerId, option: options[value] })),
    [dispatch, runnerId, options]
  );

  return (
    <Box gap="small">
      <Box direction="row" gap="small">
        <Text alignSelf="center" style={{ whiteSpace: 'nowrap' }}>
          {runnerName}
        </Text>
        <OptionSelector
          flex
          options={formattedOptions}
          value={selectedOption?.id}
          onChange={handleChange}
        />
      </Box>
      {trailingRunnerOptions && <RunnerPrompt {...trailingRunnerOptions} />}
    </Box>
  );
};

export default RunnerPrompt;
