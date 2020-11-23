import React, { FC, useMemo, useCallback, useEffect } from 'react';
import { Box, Text, Heading } from 'grommet';
import { useDispatch } from 'react-redux';

import OptionSelector from './OptionSelector';

import { getShortPlayerName } from 'state/players/selectors';
import { getSelectedRunnerOption } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppSelector } from 'utils/hooks';
import { getRunnerOptionLabel } from 'utils/labels';

import { RunnerOptions } from 'state/prompts/types';

const RunnerPrompt: FC<RunnerOptions & { nested?: boolean }> = ({
  runnerId,
  options,
  defaultOption,
  getTrailingRunnerOptions,
  nested,
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
    () => options.map(option => ({ label: getRunnerOptionLabel(option), value: option.id })),
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
    <Box gap="xsmall">
      {!nested && (
        <Heading level={4} margin="none" alignSelf="center">
          Runner Movement
        </Heading>
      )}
      <Text margin={nested ? { top: 'small' } : undefined}>{runnerName}</Text>
      <OptionSelector
        options={formattedOptions}
        value={selectedOption?.id}
        onChange={handleChange}
      />
      {trailingRunnerOptions && <RunnerPrompt {...trailingRunnerOptions} nested={true} />}
    </Box>
  );
};

export default RunnerPrompt;
