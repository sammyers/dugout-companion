import React, { FC } from 'react';
import { Box, ColumnConfig, DataTable, Text } from 'grommet';

import { GetSingleSeasonStatLeadersQuery, SimplifyType } from '@sammyers/dc-shared';

import PlayerLink from '../util/PlayerLink';

type LeaderRow = NonNullable<
  SimplifyType<GetSingleSeasonStatLeadersQuery['doublesLeaders']>
>[number];

interface Props {
  name: string;
  leaders: LeaderRow[];
  decimal?: boolean;
}

const SeasonLeaderboard: FC<Props> = ({ name, leaders, decimal }) => {
  const columns: ColumnConfig<LeaderRow & { place: number }>[] = [
    {
      property: 'place',
      header: (
        <Text weight="bold" size="large" color="accent-4">
          {name}
        </Text>
      ),
      render: row => {
        const color = row.place === 1 ? 'accent-1' : 'light-1';
        return (
          <Text weight="bold" color={color}>
            {`${row.place}. `}
            <PlayerLink color={color} player={row.player} />
          </Text>
        );
      },
    },
    {
      property: 'value',
      header: '',
      render: row => (
        <Text color={row.place === 1 ? 'accent-1' : undefined}>
          {decimal ? row.value!.toFixed(3) : row.value}
        </Text>
      ),
    },
    {
      property: 'season',
      header: <Text color="accent-4">Year</Text>,
      render: row => <Text color={row.place === 1 ? 'accent-1' : undefined}>{row.season}</Text>,
    },
  ];

  return (
    <Box pad="small" background="neutral-5" round="small">
      <DataTable
        fill
        columns={columns}
        data={leaders.map((row, i) => ({ ...row, place: i + 1 }))}
        background={{ body: ['neutral-5', 'neutral-6'] }}
      />
    </Box>
  );
};

export default SeasonLeaderboard;
