import { parse } from 'date-fns';
import { ColumnConfig, ResponsiveContext } from 'grommet';
import { useContext, useMemo } from 'react';

import { Maybe } from '@sammyers/dc-shared';

export interface PlayerRecord {
  player: Maybe<{
    id: string;
    fullName: Maybe<string>;
  }>;
}
export const extractPlayerName = ({ player }: PlayerRecord) => {
  if (player) {
    return player.fullName!;
  }
};

export const useResponsiveColumns = <T>(
  columns: ColumnConfig<T>[],
  sizeMap: Record<string, string[]>
) => {
  const screenSize = useContext(ResponsiveContext);
  const hideColumns = screenSize in sizeMap ? sizeMap[screenSize] : [];

  const filteredColumns = useMemo(
    () => columns.filter(column => !hideColumns.includes(column.property)),
    [columns, hideColumns]
  );

  return filteredColumns;
};

export const parseLegacyDate = (date: string, time: string = '00:00:00') =>
  parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm:ss', new Date());

interface BasicStatRow {
  plateAppearances: number;
  atBats: number;
  hits: number;
  runs: number;
  doubles: number;
  triples: number;
  homeruns: number;
  walks: number;
  sacFlies: number;
}

export const getBattingAverage = (row: BasicStatRow) => row.hits / row.atBats;
export const getOnBasePercentage = (row: BasicStatRow) =>
  (row.hits + row.walks) / (row.atBats + row.walks + row.sacFlies);
export const getSluggingPercentage = (row: BasicStatRow) =>
  (row.hits + row.doubles + 2 * row.triples + 3 * row.homeruns) / row.atBats;
export const getOps = (row: BasicStatRow) => getOnBasePercentage(row) + getSluggingPercentage(row);
