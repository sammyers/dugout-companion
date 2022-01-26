import React from 'react';
import { Box } from 'grommet';
import { useSearchParams } from 'react-router-dom';

import CareerLeaders from './CareerLeaders';
import SeasonLeaders from './SeasonLeaders';
import SingleSeasonLeaders from './SingleSeasonLeaders';

import SeasonSelector from '../util/SeasonSelector';

const LeadersPage = () => {
  const [searchParams] = useSearchParams();
  const season = searchParams.get('season');

  return (
    <Box>
      <SeasonSelector margin={{ horizontal: 'small' }} />
      {season ? (
        <SeasonLeaders season={Number(season)} />
      ) : (
        <Box gap="medium">
          <CareerLeaders />
          <SingleSeasonLeaders />
        </Box>
      )}
    </Box>
  );
};

export const LeadersPageTitle = () => {
  const [searchParams] = useSearchParams();
  const season = searchParams.get('season');

  if (season) {
    return <>Batting Leaders - {season} Season</>;
  }

  return <>Batting Leaders - All Time</>;
};

export default LeadersPage;
