import React from 'react';
import { getYear } from 'date-fns';
import { Box, Button, ColumnConfig, DataTable, Text } from 'grommet';
import { useNavigate } from 'react-router-dom';

import {
  GetPreviewStatsQuery,
  SimplifyType,
  useGetPreviewStatsQuery,
  groupIdOptions,
} from '@sammyers/dc-shared';

import PlayerLink from './util/PlayerLink';

import { useCurrentGroupId } from './context';
import { useResponsiveColumns } from '../utils';

type PlayerStatRow = NonNullable<SimplifyType<GetPreviewStatsQuery['seasonStats']>>[number];
const columnDefs: ColumnConfig<PlayerStatRow>[] = [
  {
    property: 'player',
    header: 'Player',
    render: ({ player }) => <PlayerLink player={player} legacyPlayer={null} />,
    sortable: false,
  },
  {
    property: 'games',
    header: 'G',
  },
  {
    property: 'atBats',
    header: 'AB',
  },
  {
    property: 'runs',
    header: 'R',
  },
  {
    property: 'hits',
    header: 'H',
  },
  {
    property: 'xbh',
    header: 'XBH',
  },
  {
    property: 'doubles',
    header: '2B',
  },
  {
    property: 'triples',
    header: '3B',
  },
  {
    property: 'homeruns',
    header: 'HR',
  },
  {
    property: 'rbi',
    header: 'RBI',
  },
  {
    property: 'walks',
    header: 'BB',
  },
  {
    property: 'sacFlies',
    header: 'SAC',
  },
  {
    property: 'battingAverage',
    header: 'AVG',
    render: row => row.battingAverage!.toFixed(3),
  },
  {
    property: 'onBasePct',
    header: 'OBP',
    render: row => row.onBasePct!.toFixed(3),
  },
  {
    property: 'ops',
    header: 'OPS',
    render: row => row.ops!.toFixed(3),
  },
];

const StatsWidget = () => {
  const navigate = useNavigate();

  const currentYear = getYear(new Date());
  const groupId = useCurrentGroupId();
  const { data } = useGetPreviewStatsQuery(groupIdOptions(groupId, { currentSeason: currentYear }));

  const columns = useResponsiveColumns(columnDefs, {
    xsmall: ['runs', 'rbi', 'sacFlies', 'doubles', 'triples', 'homeruns', 'battingAverage'],
    small: ['xbh', 'battingAverage'],
    medium: ['xbh'],
    large: ['xbh'],
  });

  if (!data) {
    return null;
  }

  return (
    <Box gridArea="stats" round="small" background="neutral-5" pad="small" gap="small">
      <Box
        fill
        alignSelf="center"
        direction="row"
        justify="between"
        align="center"
        pad={{ horizontal: 'small' }}
      >
        <Text weight="bold">{currentYear} Stats</Text>
        <Button plain={false} color="accent-2" onClick={() => navigate('/stats')}>
          All Stats
        </Button>
      </Box>
      <DataTable
        sortable
        columns={columns}
        data={data.seasonStats!}
        pad="xsmall"
        background={{ body: ['neutral-5', 'neutral-6'] }}
      />
    </Box>
  );
};

export default StatsWidget;
