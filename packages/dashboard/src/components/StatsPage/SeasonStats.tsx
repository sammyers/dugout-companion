import React, { FC, useMemo } from 'react';
import { ColumnConfig, DataTable } from 'grommet';

import {
  GetStatsForSeasonQuery,
  groupIdOptions,
  SimplifyType,
  useGetStatsForSeasonQuery,
} from '@sammyers/dc-shared';

import PlayerLink from '../util/PlayerLink';

import { useResponsiveColumns } from '../../utils';
import { useCurrentGroupId } from '../context';

type PlayerStatResult = NonNullable<SimplifyType<GetStatsForSeasonQuery['seasonStats']>>[number];

const columnDefs: ColumnConfig<PlayerStatResult>[] = [
  {
    property: 'player',
    sortable: false,
    header: 'Player',
    render: ({ player, legacyPlayer }) => (
      <PlayerLink player={player} legacyPlayer={legacyPlayer} />
    ),
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

const SeasonStats: FC<{ season: number; qualified: boolean }> = ({ season, qualified }) => {
  const groupId = useCurrentGroupId();
  const { data } = useGetStatsForSeasonQuery(groupIdOptions(groupId, { season }));

  const columns = useResponsiveColumns(columnDefs, {
    xsmall: ['atBats', 'runs', 'walks', 'sacFlies', 'doubles', 'triples', 'rbi', 'battingAverage'],
    small: ['runs', 'rbi'],
  });

  const rows = useMemo(() => {
    if (data) {
      if (qualified) {
        return data.seasonStats?.filter(row => row.atBats! >= data.season!.totalGames * 2);
      }
      return data.seasonStats;
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

export default SeasonStats;
