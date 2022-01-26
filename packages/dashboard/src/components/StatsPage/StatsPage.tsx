import React, { useState } from 'react';
import { Box, CheckBox, Text } from 'grommet';
import { useSearchParams } from 'react-router-dom';

import SeasonSelector from '../util/SeasonSelector';
import CareerStats from './CareerStats';
import SeasonStats from './SeasonStats';

const StatsPage = () => {
  const [searchParams] = useSearchParams();
  const season = searchParams.get('season');

  const [qualifiedBatters, setQualifiedBatters] = useState(true);

  return (
    <Box>
      <Box direction="row" gap="medium" margin={{ horizontal: 'small' }}>
        <SeasonSelector />
        <CheckBox
          checked={qualifiedBatters}
          onChange={e => setQualifiedBatters(e.target.checked)}
          label={<Text alignSelf="center">Qualified Batters</Text>}
        />
      </Box>
      <Box margin="small" pad="small" background="neutral-5" round="small">
        {season ? (
          <SeasonStats season={Number(season)} qualified={qualifiedBatters} />
        ) : (
          <CareerStats qualified={qualifiedBatters} />
        )}
      </Box>
    </Box>
  );
};

export const StatsPageTitle = () => {
  const [searchParams] = useSearchParams();
  const season = searchParams.get('season');

  if (season) {
    return <>Player Stats - {season} Season</>;
  }

  return <>Player Stats - All Time</>;
};

export default StatsPage;
