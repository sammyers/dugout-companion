import React, { useCallback } from 'react';
import { Box, Select, Text } from 'grommet';
import { useSearchParams } from 'react-router-dom';

import { groupIdOptions, useGetAllAvailableSeasonsQuery } from '@sammyers/dc-shared';

import CareerLeaders from './CareerLeaders';
import SeasonLeaders from './SeasonLeaders';
import SingleSeasonLeaders from './SingleSeasonLeaders';

import { useCurrentGroupId } from '../context';

const LeadersPage = () => {
  const groupId = useCurrentGroupId();
  const { data } = useGetAllAvailableSeasonsQuery(groupIdOptions(groupId, {}));

  const [searchParams, setSearchParams] = useSearchParams();
  const season = searchParams.get('season');

  const setSeason = useCallback(
    (season: string) => {
      const newParams = new URLSearchParams();
      if (season !== 'none') {
        newParams.set('season', season);
      }
      setSearchParams(newParams);
    },
    [setSearchParams]
  );

  return (
    <Box>
      {data && (
        <Box direction="row" margin={{ horizontal: 'small' }} gap="small" align="center">
          <Text>Season: </Text>
          <Select
            size="small"
            options={[
              { label: 'None', value: 'none' },
              ...data.group!.allSeasons!.map(season => ({
                label: String(season),
                value: String(season),
              })),
            ]}
            labelKey="label"
            valueKey={{ key: 'value', reduce: true }}
            value={season ?? 'none'}
            onChange={({ value }) => setSeason(value)}
          />
        </Box>
      )}
      {season ? (
        <SeasonLeaders season={Number(season)} />
      ) : (
        <Box gap="medium">
          <CareerLeaders />
          <SingleSeasonLeaders />
        </Box>
      )}
    </Box>
  );
};

export const LeadersPageTitle = () => {
  const [searchParams] = useSearchParams();
  const season = searchParams.get('season');

  if (season) {
    return <>Batting Leaders - {season} Season</>;
  }

  return <>Batting Leaders - All Time</>;
};

export default LeadersPage;
