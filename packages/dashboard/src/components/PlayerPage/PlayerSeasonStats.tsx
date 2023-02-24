import React, { FC, ReactNode, useMemo, useLayoutEffect } from 'react';
import { ColumnConfig, DataTable, Text, ThemeContext } from 'grommet';
import _ from 'lodash';

import PageBlock from '../util/PageBlock';
import PlayerSeasonGames from './PlayerSeasonGames';

import {
  getBattingAverage,
  getOnBasePercentage,
  getOps,
  getSluggingPercentage,
  useResponsiveColumns,
} from '../../utils';
import { useCurrentGroupId } from '../context';

import { PlayerProfile, SeasonRow } from './types';

const columnDefs: ColumnConfig<SeasonRow>[] = [
  {
    property: 'season',
    header: 'Year',
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
    property: 'avg',
    header: 'AVG',
    render: row => getBattingAverage(row).toFixed(3),
  },
  {
    property: 'obp',
    header: 'OBP',
    render: row => getOnBasePercentage(row).toFixed(3),
  },
  {
    property: 'slg',
    header: 'SLG',
    render: row => getSluggingPercentage(row).toFixed(3),
  },
  {
    property: 'ops',
    header: 'OPS',
    render: row => getOps(row).toFixed(3),
  },
];

interface Props extends PlayerProfile {}

const PlayerSeasonStats: FC<Props> = ({
  careerBattingStats,
  seasonBattingStats,
  gameBattingStats,
}) => {
  const groupId = useCurrentGroupId();

  const responsiveColumns = useResponsiveColumns(columnDefs, {
    xsmall: [
      'games',
      'runs',
      'walks',
      'sacFlies',
      'doubles',
      'triples',
      'rbi',
      'battingAverage',
      'sluggingPct',
      'stolenBases',
    ],
    small: ['runs', 'sacFlies', 'battingAverage', 'sluggingPct', 'stolenBases'],
  });
  const columns = useMemo(() => {
    const careerRow = { ...careerBattingStats[0], season: null };
    return responsiveColumns.map(column => {
      let footerContent: ReactNode;
      if (column.property === 'season') {
        footerContent = 'Career';
      } else {
        if (column.render) {
          footerContent = column.render(careerRow);
        } else {
          footerContent = careerRow[column.property as keyof SeasonRow];
        }
      }
      return {
        ...column,
        footer: (
          <Text weight="bold" style={{ fontStyle: 'italic' }}>
            {footerContent}
          </Text>
        ),
      };
    });
  }, [careerBattingStats, responsiveColumns]);

  const battingLinesBySeason = useMemo(
    () =>
      _.groupBy(
        gameBattingStats.filter(({ game }) => game?.groupId === groupId),
        'game.season'
      ),
    [gameBattingStats, groupId]
  );

  // This is incredibly jank but seems to be the only way to make the footer columns line up
  const tableId = useMemo(() => _.uniqueId('gameTable_'), []);
  useLayoutEffect(() => {
    const tableElement = document.getElementById(tableId);
    const footer = tableElement?.getElementsByTagName('tfoot')[0].getElementsByTagName('tr')[0];
    const firstTd = footer?.getElementsByTagName('td')[0];
    if (firstTd?.className) {
      // This one is already styled
      const emptyTd = document.createElement('td');
      emptyTd.style.width = '48px';
      emptyTd.style.borderTop = getComputedStyle(firstTd).borderTop;
      footer?.prepend(emptyTd);
    }
  }, [tableId]);

  return (
    <PageBlock>
      <ThemeContext.Extend value={{ dataTable: { header: { font: { weight: 'bold' } } } }}>
        <DataTable
          id={tableId}
          fill
          sortable
          columns={columns}
          data={seasonBattingStats}
          pad="xsmall"
          background={{ body: ['neutral-5', 'neutral-6'] }}
          rowDetails={({ season }: SeasonRow) => (
            <PlayerSeasonGames games={battingLinesBySeason[season!]} />
          )}
        />
      </ThemeContext.Extend>
    </PageBlock>
  );
};

export default PlayerSeasonStats;
