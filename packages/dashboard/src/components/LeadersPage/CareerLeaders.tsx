import React, { FC } from 'react';
import { Box, Grid, Heading } from 'grommet';

import { groupIdOptions, useGetCareerStatLeadersQuery } from '@sammyers/dc-shared';

import Leaderboard from './Leaderboard';

import { useCurrentGroupId, useCurrentGroupName } from '../context';

const CareerLeaders: FC = () => {
  const groupId = useCurrentGroupId();
  const groupName = useCurrentGroupName();

  const { data } = useGetCareerStatLeadersQuery(
    groupIdOptions(groupId, { qualifyingPAs: groupName === 'SF Meetup' ? 400 : 100 })
  );

  if (!data) {
    return null;
  }

  return (
    <Box margin="small">
      <Heading level={3} margin="small">
        Career Leaders
      </Heading>
      <Grid columns="min(100%, max(240px, 30%))" gap="small">
        <Leaderboard name="On-Base Percentage" decimal leaders={data.onBasePctLeaders!} />
        <Leaderboard name="OPS" decimal leaders={data.opsLeaders!} />
        <Leaderboard name="Home Runs" leaders={data.homerunsLeaders!} />
        <Leaderboard name="Doubles" leaders={data.doublesLeaders!} />
        <Leaderboard name="Walks" leaders={data.walksLeaders!} />
        <Leaderboard name="RBI" leaders={data.rbiLeaders!} />
      </Grid>
    </Box>
  );
};

export default CareerLeaders;
