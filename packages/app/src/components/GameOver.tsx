import { Box, Button, Heading, Main } from 'grommet';
import React, { useCallback } from 'react';
import { Redirect } from 'react-router-dom';

import SaveGameButton from './SaveGameButton';

import {
  getCurrentGameLength,
  getGameStatus,
  getMaxGameLength,
  getScore,
} from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { GameStatus } from 'state/game/types';
import { useAppDispatch, useAppSelector } from 'utils/hooks';

const GameOver = () => {
  const dispatch = useAppDispatch();

  const gameStatus = useAppSelector(getGameStatus);
  const [awayScore, homeScore] = useAppSelector(getScore);
  const gameLength = useAppSelector(getCurrentGameLength);
  const maxGameLength = useAppSelector(getMaxGameLength);

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
    return <Redirect to="/field" />;
  }
  if (gameStatus === GameStatus.NOT_STARTED) {
    return <Redirect to="/teams" />;
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
      <Box gap="small">
        {gameLength < maxGameLength && (
          <Button
            color="light-1"
            plain={false}
            label="Play another inning"
            onClick={onClickExtendGame}
          />
        )}
        <SaveGameButton />
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
    </Main>
  );
};

export default GameOver;
