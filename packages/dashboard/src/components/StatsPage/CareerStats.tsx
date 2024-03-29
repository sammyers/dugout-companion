import React, { FC, useMemo } from 'react';
import { ColumnConfig, DataTable } from 'grommet';

import {
  GetCareerStatsQuery,
  groupIdOptions,
  SimplifyType,
  useGetCareerStatsQuery,
} from '@sammyers/dc-shared';

import PlayerLink from '../util/PlayerLink';

import { useResponsiveColumns } from '../../utils';
import { useCurrentGroupId } from '../context';

type PlayerStatResult = NonNullable<
  SimplifyType<GetCareerStatsQuery['careerBattingStats']>
>[number];

const columnDefs: ColumnConfig<PlayerStatResult>[] = [
  {
    property: 'player',
    header: 'Player',
    render: ({ player }) => <PlayerLink player={player} />,
    sortable: false,
  },
  {
    property: 'seasons',
    header: 'YR',
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

const CareerStats: FC<{ qualified: boolean }> = ({ qualified }) => {
  const groupId = useCurrentGroupId();
  const { data } = useGetCareerStatsQuery(groupIdOptions(groupId, {}));

  const columns = useResponsiveColumns(columnDefs, {
    xsmall: [
      'seasons',
      'atBats',
      'runs',
      'walks',
      'sacFlies',
      'doubles',
      'triples',
      'rbi',
      'battingAverage',
      'stolenBases',
    ],
    small: ['runs', 'rbi', 'sacFlies', 'battingAverage', 'stolenBases'],
  });

  const rows = useMemo(() => {
    if (data) {
      if (qualified) {
        return data.careerBattingStats?.filter(row => row.atBats! >= 400);
      }
      return data.careerBattingStats;
    }
  }, [data, qualified]);

  if (!rows) {
    return null;
  }

  return (
    <DataTable
      fill
      sortable
      columns={columns}
      data={rows}
      pad="xsmall"
      background={{ body: ['neutral-5', 'neutral-6'] }}
    />
  );
};

export default CareerStats;
