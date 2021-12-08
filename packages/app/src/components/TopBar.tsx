import React, { useCallback } from 'react';
import { Header, Nav, Button, Box, DropButton } from 'grommet';
import { SettingsOption } from 'grommet-icons';
import { Routes, Route, useNavigate } from 'react-router-dom';

import { BasesPreview } from '@sammyers/dc-shared';

import AnchorLink from './AnchorLink';
import ScoreBug from './ScoreBug';
import SettingsMenu from './SettingsMenu';

import { canStartGame, getRunnerNames, isGameInProgress } from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

const TopBar = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const gameInProgress = useAppSelector(isGameInProgress);
  const gameCanStart = useAppSelector(canStartGame);
  const runners = useAppSelector(getRunnerNames);

  const startGame = useCallback(() => {
    dispatch(gameActions.startGame());
    navigate('/field');
  }, [dispatch, navigate]);

  return (
    <Header background="neutral-5">
      <Nav direction="row" pad="medium">
        <AnchorLink to="/teams">Teams</AnchorLink>
        {gameInProgress && <AnchorLink to="/box-score">Box Score</AnchorLink>}
        {gameInProgress && <AnchorLink to="/plays">Plays</AnchorLink>}
        {gameInProgress && <AnchorLink to="/field">Scorekeeper</AnchorLink>}
      </Nav>
      <Box direction="row" margin={{ right: 'small' }}>
        {gameInProgress && (
          <Box alignSelf="center" margin={{ right: 'medium' }}>
            <BasesPreview bases={runners} />
          </Box>
        )}
        {gameInProgress ? (
          <ScoreBug />
        ) : (
          <Routes>
            <Route
              path="/teams"
              element={
                <Button
                  plain={false}
                  disabled={!gameCanStart}
                  onClick={startGame}
                  margin={{ right: 'small' }}
                >
                  Start Game
                </Button>
              }
            />
          </Routes>
        )}
        <DropButton
          margin={{ left: 'small' }}
          icon={<SettingsOption />}
          plain={false}
          alignSelf="center"
          color="light-1"
          dropAlign={{ top: 'bottom', right: 'right' }}
          dropProps={{ margin: { top: 'xsmall' }, round: 'xsmall' }}
          dropContent={<SettingsMenu />}
        />
      </Box>
    </Header>
  );
};

export default TopBar;
