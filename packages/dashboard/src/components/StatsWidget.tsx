import React from 'react';
import { getYear } from 'date-fns';
import { Box, Button, ColumnConfig, DataTable } from 'grommet';

import {
  GetPreviewStatsQuery,
  SimplifyType,
  useGetPreviewStatsQuery,
  groupIdOptions,
} from '@sammyers/dc-shared';

import { useCurrentGroupId } from './context';
import { useNavigate } from 'react-router-dom';

type PlayerStatResult = NonNullable<SimplifyType<GetPreviewStatsQuery['seasonStats']>>[number];
type PlayerStatRow = SimplifyType<Omit<PlayerStatResult, 'player'> & PlayerStatResult['player']>;
const columns: ColumnConfig<PlayerStatRow>[] = [
  {
    property: 'fullName',
    header: 'Player',
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
    property: 'hits',
    header: 'H',
  },
  {
    property: 'xbh',
    header: 'XBH',
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

// TODO: filter columns for xsmall and xxsmall screens

const StatsWidget = () => {
  const navigate = useNavigate();

  const currentYear = getYear(new Date());
  const groupId = useCurrentGroupId();
  const { data } = useGetPreviewStatsQuery(groupIdOptions(groupId, { currentSeason: currentYear }));

  if (!data) {
    return null;
  }

  const rows = data.seasonStats!.map(({ player, ...stats }) => ({
    ...player!,
    ...stats,
  }));

  return (
    <Box
      gridArea="stats"
      round="small"
      background="neutral-5"
      pad="small"
      align="center"
      gap="small"
    >
      <DataTable
        fill
        sortable
        columns={columns}
        data={rows}
        pad="xsmall"
        background={{ body: ['neutral-5', 'neutral-6'] }}
      />
      <Button plain={false} color="accent-2" onClick={() => navigate('/stats')}>
        All Stats
      </Button>
    </Box>
  );
};

export default StatsWidget;
