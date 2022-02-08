import React from 'react';
import { Header, Nav, Box, DropButton } from 'grommet';
import { SettingsOption } from 'grommet-icons';
import { Routes, Route } from 'react-router-dom';

import { BasesPreview, AnchorLink } from '@sammyers/dc-shared';

import ScoreBug from './ScoreBug';
import SettingsMenu from './SettingsMenu';

import {
  getRunnerNames,
  isGameInProgress,
  isGameOver,
  isSoloModeActive,
} from 'state/game/selectors';
import { useAppSelector } from 'utils/hooks';
import StartButton from './StartButton';

const TopBar = () => {
  const gameInProgress = useAppSelector(isGameInProgress);
  const soloMode = useAppSelector(isSoloModeActive);
  const gameOver = useAppSelector(isGameOver);
  const runners = useAppSelector(getRunnerNames);

  return (
    <Header background="neutral-5">
      <Nav direction="row" pad="medium">
        {!gameOver && <AnchorLink to="/teams">Teams</AnchorLink>}
        {(gameInProgress || gameOver) && <AnchorLink to="/box-score">Box Score</AnchorLink>}
        {gameInProgress && <AnchorLink to="/plays">Plays</AnchorLink>}
        {gameInProgress && <AnchorLink to="/field">Scorekeeper</AnchorLink>}
        {gameOver && <AnchorLink to="/game-over">Save Game</AnchorLink>}
      </Nav>
      <Box direction="row" margin={{ right: 'small' }}>
        {gameInProgress && (
          <Box alignSelf="center" margin={{ right: 'medium' }}>
            <BasesPreview bases={runners} />
          </Box>
        )}
        {gameInProgress && <ScoreBug />}
        {!gameInProgress && !soloMode && (
          <Routes>
            <Route path="/teams" element={<StartButton margin={{ right: 'small' }} />} />
          </Routes>
        )}
        {!gameOver && (
          <DropButton
            margin={{ left: 'small' }}
            icon={<SettingsOption />}
            plain={false}
            alignSelf="center"
            color="light-1"
            dropAlign={{ top: 'bottom', right: 'right' }}
            dropProps={{ margin: { top: 'xsmall' }, background: 'transparent' }}
            dropContent={<SettingsMenu />}
          />
        )}
      </Box>
    </Header>
  );
};

export default TopBar;
