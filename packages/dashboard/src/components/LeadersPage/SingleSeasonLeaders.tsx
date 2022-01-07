import React, { FC } from 'react';
import { Box, Grid, Heading } from 'grommet';

import { groupIdOptions, useGetSingleSeasonStatLeadersQuery } from '@sammyers/dc-shared';

import SeasonLeaderboard from './SeasonLeaderboard';

import { useCurrentGroupId } from '../context';

const SingleSeasonLeaders: FC = () => {
  const groupId = useCurrentGroupId();

  const { data } = useGetSingleSeasonStatLeadersQuery(groupIdOptions(groupId, {}));

  if (!data) {
    return null;
  }

  return (
    <Box margin="small">
      <Heading level={3} margin="small">
        Single-Season Leaders
      </Heading>
      <Grid columns="min(100%, max(300px, 30%))" gap="small">
        <SeasonLeaderboard name="Batting Average" decimal leaders={data.battingAverageLeaders!} />
        <SeasonLeaderboard name="On-Base Percentage" decimal leaders={data.onBasePctLeaders!} />
        <SeasonLeaderboard name="OPS" decimal leaders={data.opsLeaders!} />
        <SeasonLeaderboard name="Hits" leaders={data.hitsLeaders!} />
        <SeasonLeaderboard name="Walks" leaders={data.walksLeaders!} />
        <SeasonLeaderboard name="Home Runs" leaders={data.homerunsLeaders!} />
      </Grid>
    </Box>
  );
};

export default SingleSeasonLeaders;
