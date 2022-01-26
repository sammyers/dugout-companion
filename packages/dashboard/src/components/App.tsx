import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Grommet } from 'grommet';
import { Route, Routes } from 'react-router';

import { useGetAllGroupsQuery } from '@sammyers/dc-shared';

import TopBar from './TopBar';
import Dashboard from './Dashboard';
import GamesPage, { GamesPageTitle } from './GamesPage';
import GamePage, { GamePageTitle } from './GamePage';
import StatsPage, { StatsPageTitle } from './StatsPage';
import LeadersPage, { LeadersPageTitle } from './LeadersPage';
import PlayerPage, { PlayerPageTitle } from './PlayerPage';
import LegacyGamePage, { LegacyGamePageTitle } from './GamePage/LegacyGamePage';

import theme from '../theme';
import { Group, groupContext } from './context';

const DEFAULT_GROUP = 'SF Meetup';

const DefaultTitle = () => <>{'Dugout Companion Dashboard'}</>;

const App = () => {
  const [currentGroupId, setCurrentGroupId] = useState<string>();
  const [groups, setGroups] = useState<Group[]>([]);

  const setCurrentGroup = useCallback(
    (groupId: string) => {
      setCurrentGroupId(groupId);
    },
    [setCurrentGroupId]
  );

  const currentGroup = useMemo(
    () => groups.find(group => group.id === currentGroupId) ?? groups[0],
    [groups, currentGroupId]
  );

  const { data } = useGetAllGroupsQuery();

  useEffect(() => {
    if (data?.groups) {
      setGroups(data.groups);
      setCurrentGroupId(data.groups.find(group => group.name === DEFAULT_GROUP)?.id);
    }
  }, [data]);

  return (
    <groupContext.Provider value={{ groups, currentGroup, setCurrentGroup }}>
      <Grommet
        style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}
        theme={theme}
      >
        <Box flex>
          <Routes>
            <Route path="/" element={<TopBar />}>
              <Route path="" element={<DefaultTitle />} />
              <Route path="games" element={<GamesPageTitle />} />
              <Route path="game/legacy/:id" element={<LegacyGamePageTitle />} />
              <Route path="game/:id" element={<GamePageTitle />} />
              <Route path="stats" element={<StatsPageTitle />} />
              <Route path="leaders" element={<LeadersPageTitle />} />
              <Route path="player/:id" element={<PlayerPageTitle />} />
            </Route>
          </Routes>
          <Box flex>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/games" element={<GamesPage />} />
              <Route path="game/legacy/:id" element={<LegacyGamePage />} />
              <Route path="/game/:id" element={<GamePage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/leaders" element={<LeadersPage />} />
              <Route path="/player/:id" element={<PlayerPage />} />
            </Routes>
          </Box>
        </Box>
      </Grommet>
    </groupContext.Provider>
  );
};

export default App;
