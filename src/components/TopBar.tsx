import React, { useCallback } from 'react';
import { Header, Nav, Button } from 'grommet';
import { Route, useHistory } from 'react-router-dom';

import AnchorLink from './AnchorLink';
import { canStartGame, isGameInProgress } from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import ScoreBug from './ScoreBug';

const TopBar = () => {
  const dispatch = useAppDispatch();
  const history = useHistory();

  const gameInProgress = useAppSelector(isGameInProgress);
  const gameCanStart = useAppSelector(canStartGame);

  const startGame = useCallback(() => {
    dispatch(gameActions.startGame());
    history.push('/field');
  }, [dispatch, history]);

  return (
    <Header background="brand">
      <Nav direction="row" pad="medium">
        <AnchorLink to="/teams">Teams</AnchorLink>
        {gameInProgress && <AnchorLink to="/field">Field</AnchorLink>}
      </Nav>
      {gameInProgress ? (
        <ScoreBug />
      ) : (
        <Route path="/teams">
          <Button
            plain={false}
            disabled={!gameCanStart}
            onClick={startGame}
            margin={{ right: 'medium' }}
          >
            Start Game
          </Button>
        </Route>
      )}
    </Header>
  );
};

export default TopBar;
