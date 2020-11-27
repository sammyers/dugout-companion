import React, { useCallback, useRef, useState } from 'react';
import { Header, Nav, Button, Box, Drop } from 'grommet';
import { SettingsOption } from 'grommet-icons';
import { Route, useHistory } from 'react-router-dom';

import AnchorLink from './AnchorLink';
import ScoreBug from './ScoreBug';
import SettingsMenu from './SettingsMenu';

import { canStartGame, isGameInProgress } from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

const TopBar = () => {
  const dispatch = useAppDispatch();
  const history = useHistory();

  const gameInProgress = useAppSelector(isGameInProgress);
  const gameCanStart = useAppSelector(canStartGame);

  const startGame = useCallback(() => {
    dispatch(gameActions.startGame());
    history.push('/field');
  }, [dispatch, history]);

  const settingsButtonRef = useRef<HTMLButtonElement | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const toggleSettings = useCallback(() => setShowSettings(show => !show), [setShowSettings]);

  return (
    <Header background="brand">
      <Nav direction="row" pad="medium">
        <AnchorLink to="/teams">Teams</AnchorLink>
        {gameInProgress && <AnchorLink to="/field">Field</AnchorLink>}
        {gameInProgress && <AnchorLink to="/box-score">Box Score</AnchorLink>}
        {gameInProgress && <AnchorLink to="/plays">Plays</AnchorLink>}
      </Nav>
      <Box direction="row" margin={{ right: 'small' }}>
        {gameInProgress ? (
          <ScoreBug />
        ) : (
          <Route path="/teams">
            <Button
              plain={false}
              disabled={!gameCanStart}
              onClick={startGame}
              margin={{ right: 'small' }}
            >
              Start Game
            </Button>
          </Route>
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
