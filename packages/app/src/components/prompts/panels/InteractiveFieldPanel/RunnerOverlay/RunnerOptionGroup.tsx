import React, { useCallback, FC } from 'react';
import { Box, Button } from 'grommet';

import { getCurrentSelectedRunnerOption } from 'state/prompts/selectors';
import { promptActions } from 'state/prompts/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

import { BaseType } from '@dugout-companion/shared';
import { BasepathOutcome } from 'state/prompts/types';

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

export default RunnerOptionGroup;
