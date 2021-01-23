import React, { FC } from 'react';
import { Box, Text } from 'grommet';

import { getShortPlayerName } from 'state/players/selectors';
import { useAppSelector } from 'utils/hooks';

import { BaseType } from '@sammyers/dc-shared';

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

export default SmallRunnerLabel;
