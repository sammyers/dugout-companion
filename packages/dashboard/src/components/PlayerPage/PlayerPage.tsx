import React from 'react';
import { Box, Heading, Text } from 'grommet';
import { useParams } from 'react-router-dom';

import { groupIdOptions, useGetPlayerProfileQuery } from '@sammyers/dc-shared';

import PageBlock from '../util/PageBlock';
import PlayerSeasonStats from './PlayerSeasonStats';
import { format, parse } from 'date-fns';
import { useCurrentGroupId } from '../context';

const formatDate = (dateStr: string) => {
  const date = parse(dateStr, 'yyyy-MM-dd', new Date());
  return format(date, 'MMMM do, yyyy');
};

const PlayerPage = () => {
  const { id } = useParams();
  const groupId = useCurrentGroupId();
  const { data } = useGetPlayerProfileQuery(groupIdOptions(groupId, { playerId: id! }));

  if (!data) {
    return null;
  }

  return (
    <Box>
      <PageBlock direction="row" justify="between" pad="small" wrap>
        <Text margin="small" size="16px">
          Name:{' '}
          <Text weight="bold" size="inherit">
            {data.player?.fullName}
          </Text>
        </Text>
        <Text margin="small" size="16px">
          Debut:{' '}
          <Text weight="bold" size="inherit">
            {formatDate(data.player!.debut!)}
          </Text>
        </Text>
      </PageBlock>
      <Heading level={4} margin={{ horizontal: 'medium', top: 'small', bottom: 'xsmall' }}>
        Seasons
      </Heading>
      <PlayerSeasonStats {...data.player!} />
    </Box>
  );
};

export const PlayerPageTitle = () => {
  return <>Player Profile</>;
};

export default PlayerPage;
