import React, { useContext } from 'react';
import { Box, Grid, GridColumnsType, GridSizeType, ResponsiveContext, Text } from 'grommet';

import GameWidget from './GameWidget';
import StatsWidget from './StatsWidget';
import LeadersWidget from './LeadersWidget';

const columns: Record<string, GridColumnsType> = {
  xsmall: ['auto'],
  small: ['auto'],
  medium: ['auto', 'auto'],
  large: ['auto', 'auto'],
  xlarge: ['auto', 'auto', 'auto'],
};

const rows: Record<string, GridSizeType[]> = {
  xsmall: ['auto', 'auto', 'flex'],
  small: ['auto', 'auto', 'flex'],
  medium: ['auto', 'flex'],
  large: ['auto', 'flex'],
  xlarge: ['full'],
};

const areas = {
  xsmall: [
    { name: 'game', start: [0, 0], end: [0, 0] },
    { name: 'leaderboard', start: [0, 1], end: [0, 1] },
    { name: 'stats', start: [0, 2], end: [0, 2] },
  ],
  small: [
    { name: 'game', start: [0, 0], end: [0, 0] },
    { name: 'leaderboard', start: [0, 1], end: [0, 1] },
    { name: 'stats', start: [0, 2], end: [0, 2] },
  ],
  medium: [
    { name: 'game', start: [0, 0], end: [0, 0] },
    { name: 'leaderboard', start: [1, 0], end: [1, 0] },
    { name: 'stats', start: [0, 1], end: [1, 1] },
  ],
  large: [
    { name: 'game', start: [0, 0], end: [0, 0] },
    { name: 'stats', start: [1, 0], end: [1, 1] },
    { name: 'leaderboard', start: [0, 1], end: [0, 1] },
  ],
  xlarge: [
    { name: 'game', start: [0, 0], end: [0, 0] },
    { name: 'stats', start: [1, 0], end: [1, 0] },
    { name: 'leaderboard', start: [2, 0], end: [2, 0] },
  ],
};

const GroupDashboard = () => {
  const size = useContext(ResponsiveContext);
  return (
    <Box flex="grow">
      <Grid
        style={{ flexGrow: 1 }}
        pad={{ horizontal: 'medium', bottom: 'medium', top: 'xsmall' }}
        gap="medium"
        columns={columns[size]}
        rows={rows[size]}
        areas={areas[size as keyof typeof areas]}
      >
        <GameWidget />
        <StatsWidget />
        <LeadersWidget />
      </Grid>
    </Box>
  );
};

export default GroupDashboard;
