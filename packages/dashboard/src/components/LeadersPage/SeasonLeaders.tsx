import React, { FC } from 'react';
import { Box, Grid } from 'grommet';

import { groupIdOptions, useGetStatLeadersForSeasonQuery } from '@sammyers/dc-shared';

import Leaderboard from './Leaderboard';

import { useCurrentGroupId } from '../context';

const SeasonLeaders: FC<{ season: number }> = ({ season }) => {
  const groupId = useCurrentGroupId();

  const { data } = useGetStatLeadersForSeasonQuery(groupIdOptions(groupId, { season }));

  if (!data) {
    return null;
  }

  return (
    <Box margin="small">
      <Grid columns="min(100%, max(240px, 30%))" gap="small">
        <Leaderboard name="On Base Percentage" decimal leaders={data.onBasePctLeaders!} />
        <Leaderboard name="OPS" decimal leaders={data.opsLeaders!} />
        <Leaderboard name="Home Runs" leaders={data.homerunsLeaders!} />
        <Leaderboard name="Doubles" leaders={data.doublesLeaders!} />
        <Leaderboard name="Walks" leaders={data.walksLeaders!} />
        <Leaderboard name="RBI" leaders={data.rbiLeaders!} />
      </Grid>
    </Box>
  );
};

export default SeasonLeaders;
