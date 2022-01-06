import React, { FC } from 'react';
import { Box, ColumnConfig, DataTable } from 'grommet';

import { GetCareerStatLeadersQuery, SimplifyType } from '@sammyers/dc-shared';
import { extractPlayerName } from '../../utils';

type LeaderRow = NonNullable<SimplifyType<GetCareerStatLeadersQuery['hitsLeaders']>>[number];

interface Props {
  name: string;
  leaders: LeaderRow[];
  decimal?: boolean;
}

const Leaderboard: FC<Props> = ({ name, leaders, decimal }) => {
  const columns: ColumnConfig<LeaderRow & { place: number }>[] = [
    {
      property: 'place',
      header: name,
      render: row => {
        const name = extractPlayerName(row);
        return `${row.place}. ${name}`;
      },
    },
    {
      property: 'value',
      header: '',
      render: row => (decimal ? row.value!.toFixed(3) : row.value),
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

export default Leaderboard;
