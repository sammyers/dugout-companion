import React, { FC, useMemo } from 'react';
import { format, parse } from 'date-fns';
import { Box, ColumnConfig, DataTable, Text } from 'grommet';
import _ from 'lodash';

import PageBlock from '../util/PageBlock';

import { GameRow, LegacyGameRow } from './types';
import { useResponsiveColumns } from '../../utils';

const getGameTime = (row: GameRow | LegacyGameRow) => {
  if ('game' in row) {
    return new Date(row.game!.timeStarted);
  }
  const dateStr = `${row.legacyGame!.gameDate} ${row.legacyGame!.gameStartTime}`;
  return parse(dateStr, 'yyyy-MM-dd HH:mm:ss', new Date());
};

const getGameName = (row: GameRow | LegacyGameRow) => {
  if ('game' in row) {
    return row.game?.name;
  }
  return row.legacyGame?.gameTitle;
};

const columnDefs: ColumnConfig<GameRow | LegacyGameRow>[] = [
  {
    property: 'game',
    header: 'Game',
    render: getGameName,
    sortable: false,
  },
  {
    property: 'legacyGame',
    header: 'Date',
    render: row => format(getGameTime(row), 'M/d/yy'),
    sortable: false,
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
    property: 'onBasePct',
    header: 'OBP',
    render: row => row.onBasePct!.toFixed(3),
  },
];

interface Props {
  games: (GameRow | LegacyGameRow)[];
}

const PlayerSeasonGames: FC<Props> = ({ games }) => {
  const columns = useResponsiveColumns(columnDefs, {
    xsmall: ['game', 'doubles', 'triples', 'walks', 'sacFlies'],
  });
  const rows = useMemo(
    () => games.map(game => ({ ...game, gameTime: getGameTime(game) })),
    [games]
  );

  return (
    <PageBlock background="white" margin={{ vertical: 'small' }}>
      <DataTable
        fill
        columns={columns}
        data={rows}
        pad="xsmall"
        sort={{ property: 'gameTime', direction: 'desc' }}
        background={{ body: ['white', 'light-3'] }}
      />
    </PageBlock>
  );
};

export default PlayerSeasonGames;
