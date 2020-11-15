import React from 'react';
import { Grid, Box, Text } from 'grommet';
import { Blank } from 'grommet-icons';

import EventReporter from './EventReporter';

import {
  getRunnerNames,
  getBatterName,
  getOnDeckBatterName,
  getInTheHoleBatterName,
} from 'state/game/selectors';
import { BaseType } from 'state/game/types';
import { useAppSelector } from 'utils/hooks';

import { ReactComponent as BaseIcon } from 'icons/base.svg';
import { ReactComponent as HomeIcon } from 'icons/home.svg';

const Base = ({ occupied }: { occupied?: boolean }) => (
  <Blank size="large" color={occupied ? 'brand' : undefined} fillOpacity={occupied ? 1 : undefined}>
    <BaseIcon />
  </Blank>
);
const HomePlate = () => (
  <Blank size="large">
    <HomeIcon />
  </Blank>
);

const Bases = () => {
  const {
    [BaseType.FIRST]: firstBaseRunner,
    [BaseType.SECOND]: secondBaseRunner,
    [BaseType.THIRD]: thirdBaseRunner,
  } = useAppSelector(getRunnerNames);
  const batter = useAppSelector(getBatterName);
  const onDeck = useAppSelector(getOnDeckBatterName);
  const inTheHole = useAppSelector(getInTheHoleBatterName);

  return (
    <Box fill>
      <Box flex>
        <Grid
          fill
          rows={['xsmall', 'auto', 'xsmall']}
          columns={['small', 'auto', 'small']}
          areas={[
            ['.', 'second-base', '.'],
            ['third-base', 'reporter', 'first-base'],
            ['.', 'home-plate', '.'],
          ]}
        >
          <style scoped>{`
          svg[fill-opacity="1"] use {
            fill-opacity: 1;
          }
        `}</style>
          <Box gridArea="first-base" direction="row" justify="end" align="center">
            <Text textAlign="center">{firstBaseRunner}</Text>
            <Base occupied={!!firstBaseRunner} />
          </Box>
          <Box gridArea="second-base" align="center">
            <Base occupied={!!secondBaseRunner} />
            <Text>{secondBaseRunner}</Text>
          </Box>
          <Box gridArea="third-base" direction="row" align="center">
            <Base occupied={!!thirdBaseRunner} />
            <Text textAlign="center">{thirdBaseRunner}</Text>
          </Box>
          <Box gridArea="home-plate" justify="end" align="center">
            <Text weight="bold">{batter}</Text>
            <HomePlate />
          </Box>
          <EventReporter />
        </Grid>
      </Box>
      <Box border={{ side: 'top' }} direction="row" justify="around" pad="medium">
        <Box direction="row" gap="small">
          <Text>On Deck</Text>
          <Text weight="bold">{onDeck}</Text>
        </Box>
        <Box direction="row" gap="small">
          <Text>In the Hole</Text>
          <Text weight="bold">{inTheHole}</Text>
        </Box>
      </Box>
    </Box>
  );
};

export default Bases;
