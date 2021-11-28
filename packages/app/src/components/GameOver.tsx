import React, { useCallback, useEffect } from 'react';
import { formatISO } from 'date-fns';
import { Box, Button, Heading, Main } from 'grommet';
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
import { useAppDispatch, useAppSelector } from 'utils/hooks';

import { GameStatus } from 'state/game/types';

const GameOver = () => {
  const dispatch = useAppDispatch();

  const gameStatus = useAppSelector(getGameStatus);
  const timeEnded = useAppSelector(getTimeEnded);
  const [awayScore, homeScore] = useAppSelector(getScore);
  const gameLength = useAppSelector(getCurrentGameLength);
  const maxGameLength = useAppSelector(getMaxGameLength);
  const saved = useAppSelector(wasGameSaved);

  useEffect(() => {
    if (gameStatus === GameStatus.FINISHED && !timeEnded) {
      dispatch(gameActions.setTimeEnded(formatISO(new Date())));
    }
  }, [gameStatus, timeEnded, dispatch]);

  const onClickExtendGame = useCallback(() => {
    dispatch(gameActions.extendGame());
  }, [dispatch]);

  const onClickResetGame = useCallback(() => {
    dispatch(gameActions.resetGame());
  }, [dispatch]);

  const onClickFullResetGame = useCallback(() => {
    dispatch(gameActions.fullResetGame());
  }, [dispatch]);

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
      <Box gap="medium">
        {gameLength < maxGameLength && (
          <Button
            color="light-1"
            plain={false}
            disabled={saved}
            label="Play another inning"
            onClick={onClickExtendGame}
          />
        )}
        <SaveGameButton />
        <Box direction="row" gap="small">
          <Button
            color="status-ok"
            plain={false}
            label="New Game (same teams)"
            onClick={onClickResetGame}
          />
          <Button
            color="status-ok"
            plain={false}
            label="New Game (reset teams)"
            onClick={onClickFullResetGame}
          />
        </Box>
      </Box>
    </Main>
  );
};

export default GameOver;
