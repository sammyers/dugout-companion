import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Box, CheckBox, Select, Text, ThemeContext } from 'grommet';
import { useSearchParams } from 'react-router-dom';

import { groupIdOptions, useGetAllAvailableSeasonsQuery } from '@sammyers/dc-shared';

import CareerStats from './CareerStats';
import SeasonStats from './SeasonStats';

import { useCurrentGroupId } from '../context';

const StatsPage = () => {
  const theme = useContext(ThemeContext);

  const groupId = useCurrentGroupId();
  const { data } = useGetAllAvailableSeasonsQuery(groupIdOptions(groupId, {}));

  const [searchParams, setSearchParams] = useSearchParams();
  const season = searchParams.get('season');

  const [qualifiedBatters, setQualifiedBatters] = useState(true);

  const setSeason = useCallback(
    (season: string) => {
      const newParams = new URLSearchParams();
      newParams.set('season', season);
      setSearchParams(newParams);
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (!season && data?.group) {
      setSeason(String(Math.max(...data.group.allSeasons!.map(season => season!))));
    }
  }, [season, data, setSeason]);

  if (!season || !data?.group) {
    return null;
  }

  return (
    <Box>
      <Box direction="row" gap="medium" margin={{ horizontal: 'small' }}>
        <Box direction="row" align="center" gap="small">
          <Text>Season: </Text>
          <Select
            size="small"
            options={[
              { label: 'All', value: 'all' },
              ...data.group.allSeasons!.map(season => ({
                label: String(season),
                value: String(season),
              })),
            ]}
            labelKey="label"
            valueKey={{ key: 'value', reduce: true }}
            value={season}
            onChange={({ value }) => setSeason(value)}
          />
        </Box>
        <CheckBox
          checked={qualifiedBatters}
          onChange={e => setQualifiedBatters(e.target.checked)}
          label={<Text alignSelf="center">Qualified Batters</Text>}
        />
      </Box>
      <Box margin="small" pad="small" background="neutral-5" round="small">
        {season === 'all' ? (
          <CareerStats qualified={qualifiedBatters} />
        ) : (
          <SeasonStats season={Number(season)} qualified={qualifiedBatters} />
        )}
      </Box>
    </Box>
  );
};

export const StatsPageTitle = () => {
  const [searchParams] = useSearchParams();
  const season = searchParams.get('season');

  if (season !== 'all') {
    return <>Player Stats - {season} Season</>;
  }

  return <>Player Stats - All Time</>;
};

export default StatsPage;
