import React, { FC } from 'react';
import { Box, Grid, Heading } from 'grommet';

import { groupIdOptions, useGetCareerStatLeadersQuery } from '@sammyers/dc-shared';

import Leaderboard from './Leaderboard';

import { useCurrentGroupId } from '../context';

const CareerLeaders: FC = () => {
  const groupId = useCurrentGroupId();

  const { data } = useGetCareerStatLeadersQuery(groupIdOptions(groupId, {}));

  if (!data) {
    return null;
  }

  return (
    <Box margin="small">
      <Heading level={3} margin="small">
        Career Leaders
      </Heading>
      <Grid columns="min(100%, max(240px, 30%))" gap="small">
        <Leaderboard name="Batting Average" decimal leaders={data.battingAverageLeaders!} />
        <Leaderboard name="On-Base Percentage" decimal leaders={data.onBasePctLeaders!} />
        <Leaderboard name="OPS" decimal leaders={data.opsLeaders!} />
        <Leaderboard name="Hits" leaders={data.hitsLeaders!} />
        <Leaderboard name="Walks" leaders={data.walksLeaders!} />
        <Leaderboard name="Home Runs" leaders={data.homerunsLeaders!} />
      </Grid>
    </Box>
  );
};

export default CareerLeaders;
