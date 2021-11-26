import React, { useEffect, useState } from 'react';
import { Grommet, Main, Box } from 'grommet';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useGetAllPlayersQuery, useGetAllGamesQuery } from '@sammyers/dc-shared';

import GameOver from './GameOver';
import TopBar from './TopBar';
import Bases from './Bases';
import Teams from './Teams';
import BoxScore from './BoxScore';
import Plays from './plays/Plays';

import theme from 'theme';
import { isGameOver } from 'state/game/selectors';
import { playerActions } from 'state/players/slice';
import { historyActions } from 'state/history/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

import { Game } from 'state/game/types';
import { Player } from 'state/players/types';
import { networkStatusContext } from 'utils/network';

const App = () => {
  const dispatch = useAppDispatch();

  const { pathname } = useLocation();
  const navigate = useNavigate();

  const gameOver = useAppSelector(isGameOver);

  const { data: playerData } = useGetAllPlayersQuery();
  const { data: gameData } = useGetAllGamesQuery();

  useEffect(() => {
    if (playerData) {
      dispatch(playerActions.loadPlayers(playerData.players as Player[]));
    }
  }, [playerData, dispatch]);

  useEffect(() => {
    if (gameData) {
      dispatch(historyActions.loadGames(gameData.games as Game[]));
    }
  }, [gameData, dispatch]);

  useEffect(() => {
    if (gameOver && pathname !== '/game-over') {
      navigate('/game-over', { replace: true });
    }
  }, [pathname, gameOver, navigate]);

  const [online, setOnline] = useState(false);
  useEffect(() => {
    const handleNetworkChange = () => {
      setOnline(navigator.onLine);
    };
    handleNetworkChange();
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, [setOnline]);

  return (
    <Grommet full theme={theme}>
      <networkStatusContext.Provider value={online}>
        <Box height="100%">
          {!gameOver && <TopBar />}
          <Main flex overflow={{ vertical: 'auto' }}>
            <Routes>
              <Route path="/game-over" element={<GameOver />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/field" element={<Bases />} />
              <Route path="/box-score" element={<BoxScore />} />
              <Route path="/plays" element={<Plays />} />
              <Route path="/" element={<Navigate to="/teams" />} />
            </Routes>
          </Main>
        </Box>
      </networkStatusContext.Provider>
    </Grommet>
  );
};

export default App;
