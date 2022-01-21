import React, { FC } from 'react';
import { format, parseISO } from 'date-fns';
import { Box, Button, Heading, Text } from 'grommet';
import _ from 'lodash';
import { useNavigate } from 'react-router';

import {
  Game,
  useGetLatestGameSummaryQuery,
  useGetGameSummaryQuery,
  GetLatestGameSummaryQuery,
  SimplifyType,
} from '@sammyers/dc-shared';

import LineScore from './LineScore';

import { useCurrentGroupId } from './context';

type GameSummaryProps = NonNullable<GetLatestGameSummaryQuery['games']>[number];

const GameSummary: FC<GameSummaryProps> = ({ id, name, timeStarted, timeEnded, score }) => {
  const winningScore = Math.max(...(score as number[]));

  const { data } = useGetGameSummaryQuery({ variables: { gameId: id } });

  return (
    <Box fill gap="small" justify="between">
      <Box align="center">
        <Heading level={4} margin={{ top: 'small', bottom: 'none' }}>
          Latest Game: {name}
        </Heading>
        <Text color="accent-3" alignSelf="center">
          {format(parseISO(timeStarted), 'MMMM d, h:mmaaa')}
          {' - '}
          {format(parseISO(timeEnded), 'h:mmaaa')}
        </Text>
      </Box>
      <Text weight="bold" alignSelf="center" margin={{ top: 'small' }}>
        <Text size="large" color={score[0] === winningScore ? 'status-ok' : 'status-critical'}>
          Away {score[0]}
        </Text>
        <Text size="large">{' - '}</Text>
        <Text size="large" color={score[1] === winningScore ? 'status-ok' : 'status-critical'}>
          {score[1]} Home
        </Text>
      </Text>
      {data?.game && <LineScore cells={data.game.lineScore!} teams={data.game.teams} />}
    </Box>
  );
};

const GameWidget = () => {
  const groupId = useCurrentGroupId();

  const { data } = useGetLatestGameSummaryQuery({
    skip: !groupId,
    variables: groupId ? { groupId } : undefined,
  });
  const game = data?.games?.[0];

  const navigate = useNavigate();

  return (
    <Box
      gridArea="game"
      round="small"
      background="neutral-5"
      pad={{ vertical: 'small', horizontal: 'small' }}
      gap="small"
    >
      {game ? (
        <>
          <GameSummary {...game} />
          <Box
            direction="row"
            gap="small"
            justify="between"
            margin={{ top: 'small', horizontal: 'small' }}
            flex={{ shrink: 0 }}
          >
            <Button plain={false} color="accent-2" onClick={() => navigate(`/game/${game?.id}`)}>
              More Details
            </Button>
            <Button plain={false} color="accent-2" onClick={() => navigate('/games')}>
              More Games
            </Button>
          </Box>
        </>
      ) : (
        <Text>No games yet</Text>
      )}
    </Box>
  );
};

export default GameWidget;
