import React, { FC } from 'react';
import { Box, Grid, Heading } from 'grommet';

import { groupIdOptions, useGetSingleSeasonStatLeadersQuery } from '@sammyers/dc-shared';

import SeasonLeaderboard from './SeasonLeaderboard';

import { useCurrentGroupId, useCurrentGroupName } from '../context';

const SingleSeasonLeaders: FC = () => {
  const groupId = useCurrentGroupId();
  const groupName = useCurrentGroupName();

  // TODO(sam): make better logic for determining qualifying PAs
  const { data } = useGetSingleSeasonStatLeadersQuery(
    groupIdOptions(groupId, { qualifyingPAs: groupName === 'SF Meetup' ? 200 : 50 })
  );

  if (!data) {
    return null;
  }

  return (
    <Box margin="small">
      <Heading level={3} margin="small">
        Single-Season Leaders
      </Heading>
      <Grid columns="min(100%, max(300px, 30%))" gap="small">
        <SeasonLeaderboard name="On-Base Percentage" decimal leaders={data.onBasePctLeaders!} />
        <SeasonLeaderboard name="OPS" decimal leaders={data.opsLeaders!} />
        <SeasonLeaderboard name="Home Runs" leaders={data.homerunsLeaders!} />
        <SeasonLeaderboard name="Doubles" leaders={data.doublesLeaders!} />
        <SeasonLeaderboard name="Walks" leaders={data.walksLeaders!} />
        <SeasonLeaderboard name="RBI" leaders={data.rbiLeaders!} />
      </Grid>
    </Box>
  );
};

export default SingleSeasonLeaders;
