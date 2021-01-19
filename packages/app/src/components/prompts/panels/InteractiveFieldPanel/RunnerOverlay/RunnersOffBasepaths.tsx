import React, { FC, useCallback } from 'react';
import { Box, Text } from 'grommet';

import { getPlayerGetter } from 'state/players/selectors';
import { formatShortName } from 'state/players/utils';
import { getAllRunnersOut, getAllRunnersScored } from 'state/prompts/selectors';
import { useAppSelector } from 'utils/hooks';

interface SectionProps {
  title: string;
  color: string;
  data: string[];
}

const Section: FC<SectionProps> = ({ title, color, data }) => {
  const playerGetter = useAppSelector(getPlayerGetter);

  const getName = useCallback((runnerId: string) => formatShortName(playerGetter(runnerId)), [
    playerGetter,
  ]);

  return (
    <Box align="center" gap="xsmall">
      <Text weight="bold" color={color}>
        {title}
      </Text>
      {data.map(runnerId => (
        <Text key={runnerId} size="small">
          {getName(runnerId)}
        </Text>
      ))}
    </Box>
  );
};
const RunnersOffBasepaths = () => {
  const out = useAppSelector(getAllRunnersOut);
  const scored = useAppSelector(getAllRunnersScored);

  return (
    <Box
      direction="row"
      align="start"
      gap="medium"
      style={{ position: 'absolute', bottom: 0, left: 0, transform: 'translate(-100%, 25%)' }}
    >
      {!!out.length && <Section title="Out" data={out} color="status-critical" />}
      {!!scored.length && <Section title="Scored" data={scored} color="status-ok" />}
    </Box>
  );
};

export default RunnersOffBasepaths;
