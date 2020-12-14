import React, { useEffect } from 'react';
import { Grommet, Main, Box } from 'grommet';
import { Switch, Route, Redirect, useLocation, useHistory } from 'react-router-dom';

import { useGetAllPlayersSubscription, useGetAllGamesSubscription } from '@dugout-companion/shared';

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

const App = () => {
  const dispatch = useAppDispatch();

  const { pathname } = useLocation();
  const history = useHistory();

  const gameOver = useAppSelector(isGameOver);

  const { data: playerData } = useGetAllPlayersSubscription();
  const { data: gameData } = useGetAllGamesSubscription();

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
      history.replace('/game-over');
    }
  }, [pathname, gameOver, history]);

  return (
    <Grommet full theme={theme}>
      <Box height="100%">
        {!gameOver && <TopBar />}
        <Main flex overflow={{ vertical: 'auto' }}>
          <Switch>
            <Route path="/game-over">
              <GameOver />
            </Route>
            <Route path="/teams">
              <Teams />
            </Route>
            <Route path="/field">
              <Bases />
            </Route>
            <Route path="/box-score">
              <BoxScore />
            </Route>
            <Route path="/plays">
              <Plays />
            </Route>
            <Route path="/">
              <Redirect to="/teams" />
            </Route>
          </Switch>
        </Main>
      </Box>
    </Grommet>
  );
};

export default App;
