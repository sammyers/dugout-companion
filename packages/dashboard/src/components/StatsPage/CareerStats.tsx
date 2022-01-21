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

type PlayerStatResult = NonNullable<SimplifyType<GetCareerStatsQuery['careerStats']>>[number];

const columnDefs: ColumnConfig<PlayerStatResult>[] = [
  {
    property: 'player',
    header: 'Player',
    render: ({ player, legacyPlayer }) => (
      <PlayerLink player={player} legacyPlayer={legacyPlayer} />
    ),
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
    ],
    small: ['runs', 'rbi', 'sacFlies', 'battingAverage'],
  });

  const rows = useMemo(() => {
    if (data) {
      if (qualified) {
        return data.careerStats?.filter(row => row.atBats! >= 400);
      }
      return data.careerStats;
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
