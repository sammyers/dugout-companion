import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Grommet } from 'grommet';
import { Route, Routes } from 'react-router';

import { SOLO_MODE_OPPONENT_GROUP, useGetAllGroupsQuery } from '@sammyers/dc-shared';

import TopBar from './TopBar';
import GroupDashboard from './Dashboard';
import GamesPage, { GamesPageTitle } from './GamesPage';
import GamePage, { GamePageTitle } from './GamePage';
import StatsPage, { StatsPageTitle } from './StatsPage';
import LeadersPage, { LeadersPageTitle } from './LeadersPage';
import PlayerPage, { PlayerPageTitle } from './PlayerPage';
import LegacyGamePage, { LegacyGamePageTitle } from './GamePage/LegacyGamePage';
import GroupManager from './GroupManager';
import LandingPage from './LandingPage';
import NewAccountPage from './NewAccountPage';

import theme from '../theme';
import { Group, groupContext } from './context';

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
    () => groups.find(group => group.id === currentGroupId),
    [groups, currentGroupId]
  );

  const { data } = useGetAllGroupsQuery();

  useEffect(() => {
    if (data?.groups) {
      setGroups(data.groups.filter(group => group.name !== SOLO_MODE_OPPONENT_GROUP));
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
            <Route path="/g/:groupSlug" element={<TopBar />}>
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
              <Route path="/g/:groupSlug" element={<GroupManager />}>
                <Route path="" element={<GroupDashboard />} />
                <Route path="games" element={<GamesPage />} />
                <Route path="game/legacy/:id" element={<LegacyGamePage />} />
                <Route path="game/:id" element={<GamePage />} />
                <Route path="stats" element={<StatsPage />} />
                <Route path="leaders" element={<LeadersPage />} />
                <Route path="player/:id" element={<PlayerPage />} />
              </Route>
              <Route path="/">
                <Route path="" element={<LandingPage />} />
                <Route path="new-account" element={<NewAccountPage />} />
              </Route>
            </Routes>
          </Box>
        </Box>
      </Grommet>
    </groupContext.Provider>
  );
};

export default App;
