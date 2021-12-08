import React from 'react';
import { getYear } from 'date-fns';
import { Box, ColumnConfig, DataTable } from 'grommet';

import {
  GetAllPlayerStatsQuery,
  SimplifyType,
  useGetAllPlayerStatsQuery,
} from '@sammyers/dc-shared';

import { useCurrentGroupId } from './context';

type PlayerStatResult = NonNullable<SimplifyType<GetAllPlayerStatsQuery['seasonStats']>>[number];
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
  const currentYear = getYear(new Date());
  const groupId = useCurrentGroupId();
  const { data } = useGetAllPlayerStatsQuery({
    skip: !groupId,
    variables: groupId ? { groupId, season: currentYear } : undefined,
  });

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
    </Box>
  );
};

export default StatsWidget;
