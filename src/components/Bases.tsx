import React from 'react';
import { Grid, Box, Image, Text } from 'grommet';

import { getRunnerNames, getBatterName } from 'state/game/selectors';
import { BaseType } from 'state/game/types';
import { useAppSelector } from 'utils/hooks';

const Base = () => <Image src="/icons/base.svg" />;
const HomePlate = () => <Image src="/icons/home.svg" />;

const Bases = () => {
  const runners = useAppSelector(getRunnerNames);
  const batter = useAppSelector(getBatterName);

  return (
    <Box fill>
      <Grid
        fill
        rows={['auto', 'auto', 'auto']}
        columns={['auto', 'auto', 'auto']}
        areas={[
          ['.', 'second-base', '.'],
          ['third-base', '.', 'first-base'],
          ['.', 'home-plate', '.'],
        ]}
      >
        <Box gridArea="first-base" direction="row" justify="end" align="center">
          <Text>{runners[BaseType.FIRST]}</Text>
          <Base />
        </Box>
        <Box gridArea="second-base" align="center">
          <Base />
          <Text>{runners[BaseType.SECOND]}</Text>
        </Box>
        <Box gridArea="third-base" direction="row" align="center">
          <Base />
          <Text>{runners[BaseType.THIRD]}</Text>
        </Box>
        <Box gridArea="home-plate" justify="end" align="center">
          <Text>{batter}</Text>
          <HomePlate />
        </Box>
      </Grid>
    </Box>
  );
};

export default Bases;
