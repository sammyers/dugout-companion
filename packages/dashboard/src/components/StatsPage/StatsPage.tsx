import React, { useState } from 'react';
import { Box, CheckBox, Select } from 'grommet';

import { groupIdOptions, useGetAllAvailableSeasonsQuery } from '@sammyers/dc-shared';

import { useCurrentGroupId } from '../context';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useCallback } from 'react';
import CareerStats from './CareerStats';
import SeasonStats from './SeasonStats';

const StatsPage = () => {
  const navigate = useNavigate();

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
      <Box direction="row" alignSelf="center" gap="small">
        <Select
          options={[
            { label: 'All Time', value: 'all' },
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
        <CheckBox
          checked={qualifiedBatters}
          onChange={e => setQualifiedBatters(e.target.checked)}
          label="Qualified Batters"
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
  return <>Player Stats</>;
};

export default StatsPage;
