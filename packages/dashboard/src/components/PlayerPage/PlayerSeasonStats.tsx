import React, { FC, ReactNode, useMemo, useLayoutEffect } from 'react';
import { ColumnConfig, DataTable, Text, ThemeContext } from 'grommet';
import _ from 'lodash';

import PageBlock from '../util/PageBlock';
import PlayerSeasonGames from './PlayerSeasonGames';

import { useResponsiveColumns } from '../../utils';
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
    property: 'sluggingPct',
    header: 'SLG',
    render: row => row.sluggingPct!.toFixed(3),
  },
  {
    property: 'ops',
    header: 'OPS',
    render: row => row.ops!.toFixed(3),
  },
];

interface Props extends PlayerProfile {}

const PlayerSeasonStats: FC<Props> = ({
  careerStats,
  seasonStats,
  gameBattingLines,
  legacyGameBattingLines,
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
    ],
    small: ['runs', 'sacFlies', 'battingAverage', 'sluggingPct'],
  });
  const columns = useMemo(() => {
    const careerRow = { ...careerStats[0], season: null };
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
  }, [careerStats, responsiveColumns]);

  const battingLinesBySeason = useMemo(
    () =>
      _.groupBy(
        gameBattingLines.filter(({ game }) => game?.groupId === groupId),
        'season'
      ),
    [gameBattingLines, groupId]
  );
  const legacyBattingLinesBySeason = useMemo(
    () => _.groupBy(legacyGameBattingLines, 'season'),
    [gameBattingLines]
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
          data={seasonStats}
          pad="xsmall"
          background={{ body: ['neutral-5', 'neutral-6'] }}
          rowDetails={({ season }: SeasonRow) => (
            <PlayerSeasonGames
              games={
                season! in legacyBattingLinesBySeason
                  ? legacyBattingLinesBySeason[season!]
                  : battingLinesBySeason[season!]
              }
            />
          )}
        />
      </ThemeContext.Extend>
    </PageBlock>
  );
};

export default PlayerSeasonStats;
