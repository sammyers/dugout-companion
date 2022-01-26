import React, { FC } from 'react';
import { getYear } from 'date-fns';
import { Box, Button, Grid, Text } from 'grommet';
import { useNavigate } from 'react-router-dom';

import {
  GetPreviewLeadersQuery,
  groupIdOptions,
  SimplifyType,
  useGetPreviewLeadersQuery,
} from '@sammyers/dc-shared';

import { useCurrentGroupId } from './context';
import PlayerLink from './util/PlayerLink';

const categories = [
  { property: 'hits', name: 'Hits' },
  { property: 'homeruns', name: 'Home Runs' },
  { property: 'walks', name: 'Walks' },
  { property: 'battingAverage', name: 'Batting Average', decimal: true },
  { property: 'onBasePct', name: 'On-Base Percentage', decimal: true },
  { property: 'ops', name: 'OPS (On-Base Plus Slugging)', decimal: true },
];

const LeadersPreview: FC<GetPreviewLeadersQuery> = props => {
  return (
    <Grid gap="small" margin={{ vertical: 'small' }} columns="min(100%, max(200px, 30%))">
      {categories.map(({ property, name, decimal }) => {
        const { player, value } = props[property as keyof SimplifyType<GetPreviewLeadersQuery>]![0];
        return (
          <Box key={property}>
            <Text alignSelf="center" weight="bold">
              {name}
            </Text>
            <Box
              direction="row"
              justify="between"
              margin={{ horizontal: 'small' }}
              pad={{ horizontal: 'medium', vertical: 'small' }}
              background="neutral-6"
              round="small"
            >
              <PlayerLink color="accent-1" player={player} legacyPlayer={null} />
              <Text color="accent-1">{decimal ? value?.toFixed(3) : value}</Text>
            </Box>
          </Box>
        );
      })}
    </Grid>
  );
};

const LeadersWidget = () => {
  const navigate = useNavigate();

  const currentSeason = getYear(new Date());
  const groupId = useCurrentGroupId();

  const { data } = useGetPreviewLeadersQuery(groupIdOptions(groupId, { currentSeason }));

  return (
    <Box gridArea="leaderboard" round="small" background="neutral-5" pad="small">
      <Box direction="row" justify="between" align="center" pad={{ horizontal: 'small' }}>
        <Text weight="bold">{currentSeason} Leaders</Text>
        <Button
          plain={false}
          color="accent-2"
          onClick={() => navigate(`/leaders?season=${currentSeason}`)}
        >
          All Leaders
        </Button>
      </Box>
      {data && <LeadersPreview {...data} />}
    </Box>
  );
};

export default LeadersWidget;
