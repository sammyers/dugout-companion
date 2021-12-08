import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Grommet } from 'grommet';
import { Route, Routes } from 'react-router';

import TopBar from './TopBar';
import Dashboard from './Dashboard';
import GamesPage, { GamesPageTitle } from './GamesPage';
import GamePage, { GamePageTitle } from './GamePage';

import theme from '../theme';
import { useGetAllGroupsQuery } from '@sammyers/dc-shared';
import { Group, groupContext } from './context';

const DEFAULT_GROUP = 'SF Meetup';

const DefaultTitle = () => <>{'Dugout Companion Stats'}</>;

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
              <Route path="game/:id" element={<GamePageTitle />} />
            </Route>
          </Routes>
          <Box flex>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/games" element={<GamesPage />} />
              <Route path="/game/:id" element={<GamePage />} />
            </Routes>
          </Box>
        </Box>
      </Grommet>
    </groupContext.Provider>
  );
};

export default App;
