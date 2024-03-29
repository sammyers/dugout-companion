import React, { FC, useMemo, useContext } from 'react';
import { format } from 'date-fns';
import { ColumnConfig, DataTable, ResponsiveContext, Text } from 'grommet';
import _ from 'lodash';

import { AnchorLink } from '@sammyers/dc-shared';

import PageBlock from '../util/PageBlock';

import { getOnBasePercentage, useResponsiveColumns } from '../../utils';

import { GameRow } from './types';

const getGameTime = (row: GameRow) => new Date(row.game!.timeStarted);
const getLinkToGame = (row: GameRow) => `../game/${row.game!.id}`;

const columnDefs: ColumnConfig<GameRow>[] = [
  {
    property: 'game',
    header: 'Game',
    render: row => (
      <Text>
        <AnchorLink to={getLinkToGame(row)} defaultColor="neutral-1" weight="bold">
          {row.game?.name}
        </AnchorLink>
      </Text>
    ),
    sortable: false,
  },
  {
    property: 'game.gameStartTime',
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
    property: 'stolenBases',
    header: 'SB',
  },
  {
    property: 'onBasePct',
    header: 'OBP',
    render: row => getOnBasePercentage(row).toFixed(3),
  },
];
const gameDatePrimaryColumn: ColumnConfig<GameRow> = {
  ...columnDefs[1],
  header: 'Game Date',
  render: row => (
    <Text>
      <AnchorLink to={getLinkToGame(row)} defaultColor="accent-2" weight="bold">
        {format(getGameTime(row), 'M/d/yy')}
      </AnchorLink>
    </Text>
  ),
};

interface Props {
  games: GameRow[];
}

const PlayerSeasonGames: FC<Props> = ({ games }) => {
  const size = useContext(ResponsiveContext);

  const responsiveColumns = useResponsiveColumns(columnDefs, {
    xsmall: ['game', 'doubles', 'triples', 'walks', 'sacFlies', 'stolenBases'],
    small: ['game'],
  });
  const columns = useMemo(
    () =>
      responsiveColumns.map(column => {
        if (['xsmall', 'small'].includes(size) && column.property === 'legacyGame') {
          return gameDatePrimaryColumn;
        }
        return column;
      }),
    [responsiveColumns]
  );
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
