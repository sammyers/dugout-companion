import React, { useEffect } from 'react';
import { Grommet, Main, Box } from 'grommet';
import { Switch, Route, Redirect, useLocation, useHistory } from 'react-router-dom';

import TopBar from './TopBar';
import Bases from './Bases';
import Teams from './Teams';
import BoxScore from './BoxScore';
import Plays from './plays/Plays';

import theme from 'theme';
import { isGameOver } from 'state/game/selectors';
import { addPlayer } from 'state/players/slice';
import { players } from 'state/players/testData';
import { useMount, useAppDispatch, useAppSelector } from 'utils/hooks';
import GameOver from './GameOver';

const App = () => {
  const dispatch = useAppDispatch();

  const { pathname } = useLocation();
  const history = useHistory();

  const gameOver = useAppSelector(isGameOver);

  useMount(() => {
    players.forEach(player => {
      const [firstName, lastName] = player.split(' ');
      dispatch(addPlayer({ firstName, lastName }));
    });
  });

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
