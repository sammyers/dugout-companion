import React, { useCallback } from 'react';
import { Header, Nav, Button } from 'grommet';
import { Route } from 'react-router-dom';

import AnchorLink from './AnchorLink';
import { canStartGame, isGameInProgress } from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

const TopBar = () => {
  const dispatch = useAppDispatch();

  const gameInProgress = useAppSelector(isGameInProgress);
  const gameCanStart = useAppSelector(canStartGame);

  const startGame = useCallback(() => {
    dispatch(gameActions.startGame());
  }, [dispatch]);

  return (
    <Header background="brand" pad="medium">
      <Nav direction="row">
        <AnchorLink to="/teams">Teams</AnchorLink>
        <AnchorLink to="/field">Field</AnchorLink>
      </Nav>
      <Route path="/teams">
        {!gameInProgress && (
          <Button disabled={!gameCanStart} onClick={startGame}>
            Start Game
          </Button>
        )}
      </Route>
    </Header>
  );
};

export default TopBar;
