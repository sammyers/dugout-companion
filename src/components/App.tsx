import React, { useCallback } from 'react';
import { Grommet, Main, Header, Nav, Box, Button } from 'grommet';
import { Switch, Route, Redirect } from 'react-router-dom';

import AnchorLink from './AnchorLink';
import Bases from './Bases';
import Teams from './Teams';

import theme from 'theme';
import { players } from 'state/players/testData';
import { addPlayer } from 'state/players/slice';
import { useMount, useAppDispatch, useAppSelector } from 'utils/hooks';
import { canStartGame } from 'state/game/selectors';
import { gameActions } from 'state/game/slice';

const App = () => {
  const dispatch = useAppDispatch();

  const canStart = useAppSelector(canStartGame);

  useMount(() => {
    players.forEach(player => {
      const [firstName, lastName] = player.split(' ');
      dispatch(addPlayer({ firstName, lastName }));
    });
  });

  const startGame = useCallback(() => {
    dispatch(gameActions.startGame());
  }, [dispatch]);

  return (
    <Grommet full theme={theme}>
      <Box height="100%">
        <Header background="brand" pad="medium">
          <Nav direction="row">
            <AnchorLink to="/teams">Teams</AnchorLink>
            <AnchorLink to="/field">Field</AnchorLink>
          </Nav>
          <Route path="/teams">
            <Button disabled={!canStart} onClick={startGame}>
              Start Game
            </Button>
          </Route>
        </Header>
        <Main flex overflow={{ vertical: 'auto' }}>
          <Switch>
            <Route path="/teams">
              <Teams />
            </Route>
            <Route path="/field">
              <Bases />
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
