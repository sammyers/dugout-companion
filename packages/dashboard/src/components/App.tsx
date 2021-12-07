import React from 'react';
import { Box, Grommet } from 'grommet';
import { Route, Routes, useLocation } from 'react-router';

import TopBar from './TopBar';
import Dashboard from './Dashboard';
import GamesPage, { GamesPageTitle } from './GamesPage';
import GamePage, { GamePageTitle } from './GamePage';

import theme from '../theme';

const DefaultTitle = () => <>{'Dugout Companion Stats'}</>;

const App = () => {
  return (
    <Grommet style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }} theme={theme}>
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
  );
};

export default App;
