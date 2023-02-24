import React from 'react';
import { format, getYear } from 'date-fns';
import { Box, Button, List, Text } from 'grommet';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useGetGameSummariesQuery } from '@sammyers/dc-shared';

import { useCurrentGroupId } from './context';
import { useEffect } from 'react';
import { useMemo } from 'react';
import SeasonSelector from './util/SeasonSelector';
import _ from 'lodash';

const GamesPage = () => {
  const navigate = useNavigate();
  const groupId = useCurrentGroupId();

  const [searchParams, setSearchParams] = useSearchParams();
  const season = searchParams.get('season');

  const { data } = useGetGameSummariesQuery({
    skip: !season || !groupId,
    variables: groupId && season ? { groupId, season: Number(season) } : undefined,
  });

  useEffect(() => {
    if (!season) {
      const currentSeason = getYear(new Date());
      const params = new URLSearchParams();
      params.set('season', String(currentSeason));
      setSearchParams(params, { replace: true });
    }
  }, [season, setSearchParams]);

  const games = useMemo(
    () =>
      data?.games?.map(({ id, name, score, timeStarted, timeEnded }) => ({
        id,
        name,
        score,
        startTime: new Date(timeStarted),
        endTime: new Date(timeEnded),
      })),
    [data]
  );

  if (!games) {
    return null;
  }

  return (
    <Box flex>
      <SeasonSelector margin={{ horizontal: 'small' }} includeAll={false} />
      <List
        itemKey="id"
        data={_.orderBy(games, 'startTime', 'desc')}
        defaultItemProps={{
          pad: 'medium',
          background: 'neutral-5',
          round: 'small',
          margin: 'small',
        }}
        primaryKey={({ name, startTime, endTime }) => (
          <Box>
            <Text weight="bold" size="large">
              {name}
            </Text>
            <Text color="accent-3">
              {`${format(startTime, 'M/d/yyyy (h:mmaaa ')}-${format(endTime, ' h:mmaaa)')}`}
            </Text>
          </Box>
        )}
        secondaryKey={({ score }) => {
          const [awayScore, homeScore] = score as number[];
          return (
            <Text weight="bold">
              Final Score: {awayScore ?? '?'} - {homeScore ?? '?'}
            </Text>
          );
        }}
        action={({ id }) => (
          <Button
            key={id}
            alignSelf="center"
            plain={false}
            style={{ whiteSpace: 'nowrap' }}
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
