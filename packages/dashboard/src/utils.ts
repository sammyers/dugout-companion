import { parse } from 'date-fns';
import { ColumnConfig, ResponsiveContext } from 'grommet';
import { useContext, useMemo } from 'react';

import { Maybe } from '@sammyers/dc-shared';

export interface PlayerRecord {
  player: Maybe<{
    id: string;
    fullName: Maybe<string>;
  }>;
  legacyPlayer: Maybe<{
    playerName: Maybe<string>;
  }>;
}
export const extractPlayerName = ({ player, legacyPlayer }: PlayerRecord) => {
  if (player) {
    return player.fullName!;
  }
  if (legacyPlayer!.playerName!.startsWith('Z-')) {
    return legacyPlayer!.playerName!.substring(2);
  }
  return legacyPlayer!.playerName!;
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
