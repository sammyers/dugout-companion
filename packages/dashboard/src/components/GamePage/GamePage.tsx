import React, { useMemo } from 'react';
import { Box, Grid } from 'grommet';
import _ from 'lodash';
import { useParams } from 'react-router';

import { useGetGameDetailsQuery, useGetGameTitleQuery } from '@sammyers/dc-shared';
// import GameLog from './GameLog';
import BoxScore from './BoxScore';
import LineScore from '../LineScore';
import { format, parseISO } from 'date-fns';

const GamePage = () => {
  const { id } = useParams();
  const { data } = useGetGameDetailsQuery({ variables: { id: id! } });

  if (!data) {
    return null;
  }

  const { gameLength, gameStates, gameEventRecords, boxScore, lineScore, teams } = data.game!;

  return (
    <Box margin={{ horizontal: 'small', bottom: 'small' }}>
      <Box
        background="neutral-5"
        round="small"
        margin="small"
        pad={{ vertical: 'xsmall', horizontal: 'small' }}
        alignSelf="stretch"
      >
        <LineScore cells={lineScore!} teams={teams} />
      </Box>
      <BoxScore teams={teams} boxScoreLines={boxScore!} />
      {/* <GameLog events={gameEventRecords} states={gameStates} /> */}
    </Box>
  );
};

export const GamePageTitle = () => {
  const { id } = useParams();
  const { data } = useGetGameTitleQuery({ variables: { gameId: id! } });

  if (!data) {
    return null;
  }

  return <>{`${data.game?.name} - ${format(parseISO(data.game!.timeStarted), 'M/d/yyyy')}`}</>;
};

export default GamePage;
