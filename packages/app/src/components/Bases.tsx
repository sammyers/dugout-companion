import React, { useCallback, useRef } from 'react';
import { Grid, Box, Text, Button } from 'grommet';
import { Blank, Redo, Undo } from 'grommet-icons';
import { Navigate } from 'react-router-dom';
import { ActionCreators } from 'redux-undo';

import { BaseType } from '@sammyers/dc-shared';

import EventReporter from './EventReporter';

import {
  getRunnerNames,
  getBatterName,
  getOnDeckBatterName,
  getInTheHoleBatterName,
  isGameInProgress,
  isUndoPossible,
  isRedoPossible,
} from 'state/game/selectors';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

import { ReactComponent as BaseIcon } from 'graphics/base.svg';
import { ReactComponent as HomeIcon } from 'graphics/home.svg';
import PlayNotification from './PlayNotification';

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
  const dispatch = useAppDispatch();

  const gameInProgress = useAppSelector(isGameInProgress);
  const {
    [BaseType.FIRST]: firstBaseRunner,
    [BaseType.SECOND]: secondBaseRunner,
    [BaseType.THIRD]: thirdBaseRunner,
  } = useAppSelector(getRunnerNames);
  const batter = useAppSelector(getBatterName);
  const onDeck = useAppSelector(getOnDeckBatterName);
  const inTheHole = useAppSelector(getInTheHoleBatterName);
  const undoPossible = useAppSelector(isUndoPossible);
  const redoPossible = useAppSelector(isRedoPossible);

  const undo = useCallback(() => {
    dispatch(ActionCreators.undo());
  }, [dispatch]);

  const redo = useCallback(() => {
    dispatch(ActionCreators.redo());
  }, [dispatch]);

  const boxRef = useRef<HTMLDivElement | null>(null);

  if (!gameInProgress) {
    return <Navigate to="/teams" />;
  }

  return (
    <Box fill>
      <Box flex ref={boxRef}>
        <Grid
          fill
          rows={['xsmall', 'auto', 'xsmall']}
          columns={['small', 'auto', 'small']}
          areas={[
            ['undo-redo', 'second-base', '.'],
            ['third-base', 'reporter', 'first-base'],
            ['.', 'home-plate', '.'],
          ]}
        >
          <style scoped>{`
          svg[fill-opacity="1"] use {
            fill-opacity: 1;
          }
        `}</style>
          <Box gridArea="undo-redo" direction="row" margin="medium" gap="small">
            <Button icon={<Undo />} disabled={!undoPossible} onClick={undo} />
            <Button icon={<Redo />} disabled={!redoPossible} onClick={redo} />
          </Box>
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
            <Text weight="bold" size="xlarge">
              {batter}
            </Text>
            <HomePlate />
          </Box>
          <EventReporter />
        </Grid>
        {boxRef.current && <PlayNotification target={boxRef.current} />}
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
