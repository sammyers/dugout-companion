import React, { FC, useMemo, useCallback, ChangeEvent, useEffect } from 'react';
import { RunnerOptions } from 'state/prompts/types';
import { useAppSelector } from 'utils/hooks';
import { getSelectedRunnerOption } from 'state/prompts/selectors';
import { Box, RadioButtonGroup, Button } from 'grommet';
import { useDispatch } from 'react-redux';
import { promptActions } from 'state/prompts/slice';
import { getRunnerOptionLabel } from 'utils/labels';

const RunnerPrompt: FC<RunnerOptions> = ({ runnerId, options, getTrailingRunnerOptions }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      dispatch(promptActions.clearRunnerChoice(runnerId));
    };
  }, [dispatch, runnerId, options]);

  const selectedOption = useAppSelector(state => getSelectedRunnerOption(state, runnerId));

  const formattedOptions = useMemo(
    () => options.map(option => ({ label: getRunnerOptionLabel(option), value: option.id })),
    [options]
  );

  const trailingRunnerOptions = useMemo(
    () => selectedOption && getTrailingRunnerOptions?.(selectedOption),
    [selectedOption, getTrailingRunnerOptions]
  );

  const handleChange = useCallback(
    ({ target }: ChangeEvent<HTMLInputElement>) => {
      dispatch(
        promptActions.setRunnerChoice({ runnerId, option: options[parseInt(target.value)] })
      );
    },
    [dispatch, runnerId, options]
  );

  return (
    <Box gap="xsmall">
      <RadioButtonGroup
        name={`runner_${runnerId}_options`}
        options={formattedOptions}
        value={selectedOption?.id}
        onChange={handleChange}
        direction="row"
        gap="xsmall"
      />
      {trailingRunnerOptions && <RunnerPrompt {...trailingRunnerOptions} />}
    </Box>
  );
};

export default RunnerPrompt;
