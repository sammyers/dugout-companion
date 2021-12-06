import React, { useMemo } from 'react';
import { Box, Grid } from 'grommet';
import _ from 'lodash';
import { useParams } from 'react-router';

import { useGetGameDetailsQuery } from '@sammyers/dc-shared';
// import GameLog from './GameLog';
import BoxScore from './BoxScore';
import LineScore from '../LineScore';

const GamePage = () => {
  const { id } = useParams();
  const { data } = useGetGameDetailsQuery({ variables: { id: id! } });

  if (!data) {
    return null;
  }

  const { gameLength, gameStates, gameEventRecords, boxScore, lineScore, teams } = data.game!;

  return (
    <Box>
      <LineScore cells={lineScore!} />
      <BoxScore teams={teams} boxScoreLines={boxScore!} />
      {/* <GameLog events={gameEventRecords} states={gameStates} /> */}
    </Box>
  );
};

export default GamePage;
