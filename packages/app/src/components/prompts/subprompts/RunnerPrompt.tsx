import React, { useEffect, useCallback, FC } from 'react';
import { Box, Button, Text } from 'grommet';
import _ from 'lodash';
import { useDispatch } from 'react-redux';

import { getShortPlayerName } from 'state/players/selectors';
import {
  canSelectNextRunner,
  canSelectPreviousRunner,
  getGroupedRunnerOptions,
  getOtherPromptBaserunners,
  getSelectedRunner,
  getCurrentSelectedRunnerOption,
} from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

import { BaseType } from '@dugout-companion/shared';
import { BasepathOutcome, RunnerOptions } from 'state/prompts/types';

const getOptionLayoutProperties = (base: BaseType | null) => {
  switch (base) {
    case BaseType.FIRST:
      return { top: '50%', right: 0, transform: 'translate(35%, -50%)' };
    case BaseType.SECOND:
      return { top: 0, left: '50%', transform: 'translate(-50%, -100%)' };
    case BaseType.THIRD:
      return { top: '50%', left: 0, transform: 'translate(-35%, -50%)' };
    case null:
      return { bottom: 0, left: '50%', transform: 'translate(-50%, 100%)' };
  }
};

interface RunnerOptionGroupProps {
  runnerId: string;
  base: BaseType | null;
  options: BasepathOutcome[];
}

const RunnerOptionGroup: FC<RunnerOptionGroupProps> = ({ runnerId, base, options }) => {
  const dispatch = useAppDispatch();

  const selected = useAppSelector(getCurrentSelectedRunnerOption);

  const handleSelect = useCallback(
    (id: number) => () => {
      dispatch(promptActions.setRunnerChoice({ runnerId, option: id }));
    },
    [dispatch, runnerId]
  );

  return (
    <Box
      style={{ position: 'absolute', ...getOptionLayoutProperties(base) }}
      direction={base && base !== BaseType.SECOND ? 'column' : 'row'}
      gap="xsmall"
    >
      {options.map(option => (
        <Button
          key={option.id}
          primary={selected?.id === option.id}
          onClick={handleSelect(option.id)}
          style={selected?.id !== option.id ? { background: 'white' } : undefined}
          {...(option.attemptedAdvance
            ? {
                label: option.successfulAdvance ? (option.endBase ? 'Safe' : 'Scored') : 'Out',
                color: option.successfulAdvance ? 'status-ok' : 'status-critical',
              }
            : {
                label: 'Held',
              })}
        />
      ))}
    </Box>
  );
};

const getRunnerNameLayoutProperties = (base: BaseType) => {
  switch (base) {
    case BaseType.FIRST:
      return { top: '52%', right: '31.5%', transform: 'translate(50%, -50%)' };
    case BaseType.SECOND:
      return { top: '26%', left: '50%', transform: 'translate(-50%, -50%)' };
    case BaseType.THIRD:
      return { top: '52%', left: '31.5%', transform: 'translate(-50%, -50%)' };
  }
};

interface SmallRunnerLabelProps {
  runnerId: string;
  base: BaseType;
}

const SmallRunnerLabel: FC<SmallRunnerLabelProps> = ({ runnerId, base }) => {
  const runnerName = useAppSelector(state => getShortPlayerName(state, runnerId));

  return (
    <Box style={{ position: 'absolute', ...getRunnerNameLayoutProperties(base) }}>
      <Text size="small" color="white" textAlign="center" style={{ width: 'min-content' }}>
        {runnerName}
      </Text>
    </Box>
  );
};

const RunnerPrompt: FC<RunnerOptions> = ({ runnerId }) => {
  const dispatch = useDispatch();

  const options = useAppSelector(getGroupedRunnerOptions);
  const runners = useAppSelector(getOtherPromptBaserunners);
  const selectedRunner = useAppSelector(getSelectedRunner);
  const selectedRunnerName = useAppSelector(state =>
    getShortPlayerName(state, selectedRunner ?? '')
  );
  const showNext = useAppSelector(canSelectNextRunner);
  const showPrevious = useAppSelector(canSelectPreviousRunner);

  const selectNext = useCallback(() => {
    dispatch(promptActions.selectNextRunner());
  }, [dispatch]);

  const selectPrevious = useCallback(() => {
    dispatch(promptActions.selectPreviousRunner());
  }, [dispatch]);

  useEffect(() => {
    // set initial runner
    dispatch(promptActions.setSelectedRunner(runnerId));
  }, [runnerId, dispatch]);

  return (
    <Box fill style={{ position: 'relative' }}>
      {selectedRunner &&
        options.map(({ base, options }) => (
          <RunnerOptionGroup
            key={String(base)}
            runnerId={selectedRunner}
            base={base}
            options={options}
          />
        ))}
      {_.map(runners, (base, runnerId) => (
        <SmallRunnerLabel key={runnerId} runnerId={runnerId} base={base} />
      ))}
      <Box
        pad="small"
        gap="xsmall"
        background="white"
        border
        round="8px"
        align="center"
        style={{ position: 'absolute', top: 0, right: 0, transform: 'translate(50%, -30%)' }}
      >
        <Text size="small">Selected runner:</Text>
        <Text weight="bold">{selectedRunnerName}</Text>
        <Box direction="row" gap="xsmall" margin={{ top: 'xsmall' }}>
          {showPrevious && <Button label="Previous Runner" onClick={selectPrevious} />}
          {showNext && <Button label="Next Runner" onClick={selectNext} />}
        </Box>
      </Box>
    </Box>
  );
};

export default RunnerPrompt;
