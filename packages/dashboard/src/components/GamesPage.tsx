import React from 'react';
import { format, parseISO } from 'date-fns';
import { Box, Button, List, Text } from 'grommet';
import { useNavigate } from 'react-router';

import { useGetAllGameSummariesQuery } from '@sammyers/dc-shared';

import { useCurrentGroupId } from './context';

const GamesPage = () => {
  const navigate = useNavigate();
  const groupId = useCurrentGroupId();

  const { data } = useGetAllGameSummariesQuery({
    skip: !groupId,
    variables: groupId ? { groupId } : undefined,
  });

  if (!data) {
    return null;
  }

  return (
    <Box flex>
      <List
        data={data.games!}
        defaultItemProps={{
          pad: 'medium',
          background: 'neutral-5',
          round: 'small',
          margin: 'small',
        }}
        primaryKey={({ timeStarted }) => (
          <Text weight="bold" color="accent-3">
            {format(parseISO(timeStarted), 'M/d/yyyy (h:mmaaa)')}
          </Text>
        )}
        secondaryKey={({ score }) => {
          const [awayScore, homeScore] = score as number[];
          return (
            <Text>
              {' '}
              Final Score {awayScore} - {homeScore}
            </Text>
          );
        }}
        action={({ id }) => (
          <Button
            key={id}
            alignSelf="center"
            plain={false}
            onClick={() => navigate(`../game/${id}`)}
          >
            Game Details
          </Button>
        )}
      />
    </Box>
  );
};

export const GamesPageTitle = () => <>{'Game History'}</>;

export default GamesPage;
