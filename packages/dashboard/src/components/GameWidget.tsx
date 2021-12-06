import React, { FC } from 'react';
import { format, parseISO } from 'date-fns';
import { Box, Button, Text } from 'grommet';
import _ from 'lodash';

import { Game, useGetLatestGameSummaryQuery, useGetLineScoreQuery } from '@sammyers/dc-shared';
import { useNavigate } from 'react-router';
import LineScore from './LineScore';

const GameSummary: FC<Pick<Game, 'id' | 'timeStarted' | 'timeEnded' | 'score'>> = ({
  id,
  timeStarted,
  timeEnded,
  score,
}) => {
  const winningScore = Math.max(...(score as number[]));

  const { data } = useGetLineScoreQuery({ variables: { gameId: id } });

  return (
    <Box>
      <Text color="accent-3">
        Latest Game: {format(parseISO(timeStarted), 'MMMM d, h:mmaaa')}
        {' - '}
        {format(parseISO(timeEnded), 'h:mmaaa')}
      </Text>
      <Text margin="medium" weight="bold">
        <Text size="large" color={score[0] === winningScore ? 'status-ok' : 'status-critical'}>
          Away {score[0]}
        </Text>
        {' - '}
        <Text size="large" color={score[1] === winningScore ? 'status-ok' : 'status-critical'}>
          {score[1]} Home
        </Text>
      </Text>
      {data?.game?.lineScore && <LineScore cells={data.game.lineScore} />}
    </Box>
  );
};

const GameWidget = () => {
  const { data } = useGetLatestGameSummaryQuery();
  const game = data?.games?.[0];

  const navigate = useNavigate();

  return (
    <Box
      gridArea="game"
      round="small"
      background="neutral-5"
      pad="small"
      align="center"
      gap="small"
    >
      {game ? <GameSummary {...game} /> : <Text>No games yet</Text>}
      <Box direction="row" gap="small">
        {!!game && (
          <Button plain={false} color="accent-2" onClick={() => navigate(`/game/${game?.id}`)}>
            More Details
          </Button>
        )}
        <Button plain={false} color="accent-2" onClick={() => navigate('/games')}>
          More Games
        </Button>
      </Box>
    </Box>
  );
};

export default GameWidget;
