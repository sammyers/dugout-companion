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

type PlayerStatRow = NonNullable<SimplifyType<GetPreviewStatsQuery['seasonBattingStats']>>[number];
const columnDefs: ColumnConfig<PlayerStatRow>[] = [
  {
    property: 'player',
    header: 'Player',
    render: ({ player }) => <PlayerLink player={player} />,
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
    property: 'stolenBases',
    header: 'SB',
  },
  {
    property: 'battingAverage',
    header: 'AVG',
    render: row => row.avg.toFixed(3),
  },
  {
    property: 'onBasePct',
    header: 'OBP',
    render: row => row.obp.toFixed(3),
  },
  {
    property: 'ops',
    header: 'OPS',
    render: row => row.ops.toFixed(3),
  },
];

const StatsWidget = () => {
  const navigate = useNavigate();

  const currentSeason = getYear(new Date());
  const groupId = useCurrentGroupId();
  const { data } = useGetPreviewStatsQuery(groupIdOptions(groupId, { currentSeason }));

  const columns = useResponsiveColumns(columnDefs, {
    xsmall: [
      'runs',
      'rbi',
      'sacFlies',
      'doubles',
      'triples',
      'homeruns',
      'battingAverage',
      'stolenBases',
    ],
    small: ['battingAverage', 'stolenBases'],
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
        <Text weight="bold">{currentSeason} Stats</Text>
        <Button
          plain={false}
          color="accent-2"
          onClick={() => navigate(`stats?season=${currentSeason}`)}
        >
          All Stats
        </Button>
      </Box>
      <DataTable
        sortable
        columns={columns}
        data={data.seasonBattingStats!}
        pad="xsmall"
        background={{ body: ['neutral-5', 'neutral-6'] }}
      />
    </Box>
  );
};

export default StatsWidget;
