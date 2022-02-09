import React, { useEffect, useState } from 'react';
import { Grommet, Main, Box } from 'grommet';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

import {
  useGetAllPlayersQuery,
  useGetAllGamesQuery,
  useGetAllGroupsQuery,
  useGetSoloModeOpponentBatterIdQuery,
} from '@sammyers/dc-shared';

import GameOver from './GameOver';
import TopBar from './TopBar';
import Bases from './Bases';
import Teams from './Teams';
import BoxScore from './BoxScore';
import Plays from './plays/Plays';

import theme from 'theme';
import { isGameOver } from 'state/game/selectors';
import { getCurrentGroupId } from 'state/groups/selectors';
import { groupActions } from 'state/groups/slice';
import { playerActions } from 'state/players/slice';
import { historyActions } from 'state/history/slice';
import { useAppDispatch, useAppSelector, useSyncAllPlayers } from 'utils/hooks';
import { networkStatusContext } from 'utils/network';

import { Game } from 'state/game/types';
import { Player } from 'state/players/types';
import { gameActions } from 'state/game/slice';

const App = () => {
  const dispatch = useAppDispatch();

  const { pathname } = useLocation();
  const navigate = useNavigate();

  const gameOver = useAppSelector(isGameOver);

  const { data: groupData } = useGetAllGroupsQuery();
  const { data: opponentBatterData } = useGetSoloModeOpponentBatterIdQuery();

  useEffect(() => {
    if (opponentBatterData?.player) {
      dispatch(gameActions.setSoloModeOpponentBatterId(opponentBatterData.player.id));
    }
  }, [opponentBatterData, dispatch]);

  useEffect(() => {
    if (groupData?.groups) {
      dispatch(groupActions.loadGroups(groupData.groups));
    }
  }, [groupData, dispatch]);
  const groupId = useAppSelector(getCurrentGroupId);

  const { data: playerData } = useGetAllPlayersQuery();
  const { data: gameData } = useGetAllGamesQuery({
    skip: !groupId,
    variables: groupId ? { groupId } : undefined,
  });

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
    if (gameOver && !['/game-over', '/box-score'].includes(pathname)) {
      navigate('/game-over', { replace: true });
    }
  }, [pathname, gameOver, navigate]);

  const syncAllPlayers = useSyncAllPlayers();

  const [online, setOnline] = useState(false);
  useEffect(() => {
    const handleNetworkChange = () => {
      console.log('online', navigator.onLine);
      setOnline(navigator.onLine);
    };
    handleNetworkChange();
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, [setOnline, syncAllPlayers]);

  useEffect(() => {
    if (online) {
      syncAllPlayers();
    }
  }, [online, syncAllPlayers]);

  return (
    <Grommet full theme={theme}>
      <networkStatusContext.Provider value={online}>
        <Box height="100%">
          <TopBar />
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
