import React from 'react';
import { Grommet, Main, Box } from 'grommet';
import { Switch, Route, Redirect } from 'react-router-dom';

import TopBar from './TopBar';
import Bases from './Bases';
import Teams from './Teams';
import BoxScore from './BoxScore';

import theme from 'theme';
import { players } from 'state/players/testData';
import { addPlayer } from 'state/players/slice';
import { useMount, useAppDispatch } from 'utils/hooks';

const App = () => {
  const dispatch = useAppDispatch();

  useMount(() => {
    players.forEach(player => {
      const [firstName, lastName] = player.split(' ');
      dispatch(addPlayer({ firstName, lastName }));
    });
  });

  return (
    <Grommet full theme={theme}>
      <Box height="100%">
        <TopBar />
        <Main flex overflow={{ vertical: 'auto' }}>
          <Switch>
            <Route path="/teams">
              <Teams />
            </Route>
            <Route path="/field">
              <Bases />
            </Route>
            <Route path="/box-score">
              <BoxScore />
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
