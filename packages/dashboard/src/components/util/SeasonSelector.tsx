import React, { FC, useCallback } from 'react';
import { Box, BoxProps, Select, Text } from 'grommet';
import { useSearchParams } from 'react-router-dom';

import { groupIdOptions, useGetAllAvailableSeasonsQuery } from '@sammyers/dc-shared';

import { useCurrentGroupId } from '../context';

const SeasonSelector: FC<BoxProps & { includeAll?: boolean }> = ({
  includeAll = true,
  ...props
}) => {
  const groupId = useCurrentGroupId();
  const { data } = useGetAllAvailableSeasonsQuery(groupIdOptions(groupId, {}));

  const [searchParams, setSearchParams] = useSearchParams();
  const season = searchParams.get('season');

  const setSeason = useCallback(
    (season: string) => {
      const newParams = new URLSearchParams();
      if (season !== 'all') {
        newParams.set('season', season);
      }
      setSearchParams(newParams);
    },
    [setSearchParams]
  );

  return (
    <Box direction="row" align="center" gap="small" {...props}>
      <Text>Season: </Text>
      {data && (
        <Select
          size="small"
          options={[
            ...(includeAll ? [{ label: 'All', value: 'all' }] : []),
            ...data.group!.allSeasons!.map(season => ({
              label: String(season),
              value: String(season),
            })),
          ]}
          labelKey="label"
          valueKey={{ key: 'value', reduce: true }}
          value={season ?? 'all'}
          onChange={({ value }) => setSeason(value)}
        />
      )}
    </Box>
  );
};

export default SeasonSelector;
