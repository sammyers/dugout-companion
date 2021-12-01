import React, { useCallback, useRef, useState } from 'react';
import { Header, Nav, Button, Box, Drop } from 'grommet';
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

  const settingsButtonRef = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
  const [showSettings, setShowSettings] = useState(false);

  const toggleSettings = useCallback(() => setShowSettings(show => !show), [setShowSettings]);

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
        <Button
          margin={{ left: 'small' }}
          icon={<SettingsOption />}
          plain={false}
          alignSelf="center"
          color="light-1"
          ref={settingsButtonRef}
          onClick={toggleSettings}
        />
        {showSettings && settingsButtonRef.current && (
          <Drop target={settingsButtonRef.current} align={{ top: 'bottom', right: 'right' }}>
            <SettingsMenu />
          </Drop>
        )}
      </Box>
    </Header>
  );
};

export default TopBar;
