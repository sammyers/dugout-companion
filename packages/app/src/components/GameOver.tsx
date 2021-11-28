import React, { useCallback, useEffect, useState } from 'react';
import { formatISO } from 'date-fns';
import { Box, Button, CheckBox, Heading, Main, Notification } from 'grommet';
import { Navigate } from 'react-router-dom';

import SaveGameButton from './SaveGameButton';

import {
  getCurrentGameLength,
  getGameStatus,
  getMaxGameLength,
  getScore,
  getTimeEnded,
  wasGameSaved,
} from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { getNumUnsavedGames } from 'state/unsavedGames/selectors';
import { stashCurrentGameToSaveLater } from 'state/unsavedGames/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

import { GameStatus } from 'state/game/types';
import { useNetworkStatus } from 'utils/network';

const GameOver = () => {
  const dispatch = useAppDispatch();

  const online = useNetworkStatus();

  const gameStatus = useAppSelector(getGameStatus);
  const timeEnded = useAppSelector(getTimeEnded);
  const [awayScore, homeScore] = useAppSelector(getScore);
  const gameLength = useAppSelector(getCurrentGameLength);
  const maxGameLength = useAppSelector(getMaxGameLength);
  const saved = useAppSelector(wasGameSaved);
  const numUnsavedGames = useAppSelector(getNumUnsavedGames);

  useEffect(() => {
    if (gameStatus === GameStatus.FINISHED && !timeEnded) {
      dispatch(gameActions.setTimeEnded(formatISO(new Date())));
    }
  }, [gameStatus, timeEnded, dispatch]);

  const [keepTeams, setKeepTeams] = useState(true);

  const onClickExtendGame = useCallback(() => {
    dispatch(gameActions.extendGame());
  }, [dispatch]);

  const onClickResetGame = useCallback(() => {
    if (!saved) {
      dispatch(stashCurrentGameToSaveLater());
    }
    if (keepTeams) {
      dispatch(gameActions.resetGame());
    } else {
      dispatch(gameActions.fullResetGame());
    }
  }, [saved, keepTeams, dispatch]);

  if (gameStatus === GameStatus.IN_PROGRESS) {
    return <Navigate to="/field" />;
  }
  if (gameStatus === GameStatus.NOT_STARTED) {
    return <Navigate to="/teams" />;
  }

  return (
    <Main flex background="brand" justify="center" align="center">
      <Box align="center">
        <Heading level={2} margin={{ bottom: 'small' }}>
          {awayScore > homeScore ? 'Away' : 'Home'} team wins!
        </Heading>
        <Heading margin={{ bottom: 'large' }}>
          {awayScore} - {homeScore}
        </Heading>
      </Box>
      <Box gap="medium" style={{ maxWidth: '35%' }}>
        <Box gap="xsmall">
          <SaveGameButton />
          {online && numUnsavedGames > 0 && (
            <Notification
              status="normal"
              title={`Will also save ${numUnsavedGames} previous game${
                numUnsavedGames > 1 ? 's' : ''
              }`}
            />
          )}
        </Box>
        <Box gap="xsmall">
          <Box direction="row" gap="small" justify="stretch">
            <Button
              style={{ flex: 1 }}
              color="status-ok"
              plain={false}
              label="New Game"
              onClick={onClickResetGame}
            />
            <CheckBox
              toggle
              label="Keep Teams"
              checked={keepTeams}
              onChange={e => setKeepTeams(e.target.checked)}
            />
          </Box>
          {!saved && (
            <Notification
              status="warning"
              title="The current game will be stashed locally. It will be uploaded along with the next game you save."
            />
          )}
        </Box>
        {gameLength < maxGameLength && (
          <Button
            color="light-1"
            plain={false}
            disabled={saved}
            label="Play another inning"
            onClick={onClickExtendGame}
          />
        )}
      </Box>
    </Main>
  );
};

export default GameOver;
