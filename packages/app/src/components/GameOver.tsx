import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { formatISO } from 'date-fns';
import {
  Box,
  Button,
  CheckBox,
  Heading,
  Layer,
  Main,
  Notification,
  Text,
  TextInput,
} from 'grommet';
import { Navigate } from 'react-router-dom';

import SaveGameButton from './SaveGameButton';

import {
  getCurrentGameLength,
  getGameName,
  getGameStatus,
  getMaxGameLength,
  getScore,
  getTimeEnded,
  getWinningTeamName,
  wasGameSaved,
} from 'state/game/selectors';
import { gameActions } from 'state/game/slice';
import { getNumUnsavedGames } from 'state/unsavedGames/selectors';
import { stashCurrentGameToSaveLater } from 'state/unsavedGames/slice';
import { useAppDispatch, useAppSelector } from 'utils/hooks';
import { useNetworkStatus } from 'utils/network';

import { GameStatus } from 'state/game/types';
import DumpReduxStoreButton from './DumpReduxStoreButton';

const GameOver = () => {
  const dispatch = useAppDispatch();

  const online = useNetworkStatus();

  const gameStatus = useAppSelector(getGameStatus);
  const winningTeamName = useAppSelector(getWinningTeamName);
  const gameName = useAppSelector(getGameName);
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

  const handleChangeName = useCallback(
    ({ currentTarget }: ChangeEvent<HTMLInputElement>) =>
      dispatch(gameActions.changeGameName(currentTarget.value)),
    [dispatch]
  );

  const [showConfirmNewGame, setShowConfirmNewGame] = useState(false);
  const [showConfirmExtendGame, setShowConfirmExtendGame] = useState(false);

  const onClickResetGame = useCallback(() => {
    if (!saved) {
      dispatch(stashCurrentGameToSaveLater());
    }
    if (keepTeams) {
      dispatch(gameActions.resetGame());
    } else {
      dispatch(gameActions.fullResetGame());
    }
    setShowConfirmNewGame(false);
  }, [saved, keepTeams, dispatch, setShowConfirmNewGame]);

  const onClickExtendGame = useCallback(() => {
    dispatch(gameActions.extendGame());
    setShowConfirmExtendGame(false);
  }, [dispatch]);

  if (gameStatus === GameStatus.IN_PROGRESS) {
    return <Navigate to="/field" />;
  }
  if (gameStatus === GameStatus.NOT_STARTED) {
    return <Navigate to="/teams" />;
  }

  return (
    <Main flex background="brand" justify="center" align="center">
      {showConfirmNewGame && (
        <Layer onClickOutside={() => setShowConfirmNewGame(false)} background="transparent">
          <Box pad="medium" background="light-2" round gap="small">
            <Heading level={3} margin={{ vertical: 'small' }}>
              New Game
            </Heading>
            <Text>Are you sure you want to start a new game?</Text>
            {!saved && (
              <Box margin="small">
                <Notification
                  status="warning"
                  title="The current game will be stashed locally. It will be uploaded along with the next game you save."
                />
              </Box>
            )}
            <Box direction="row" gap="medium" margin={{ top: 'small' }}>
              <Button
                color="status-critical"
                plain={false}
                label="Cancel"
                onClick={() => setShowConfirmNewGame(false)}
              />
              <Button
                color="status-ok"
                primary
                plain={false}
                label="Confirm"
                onClick={onClickResetGame}
              />
            </Box>
          </Box>
        </Layer>
      )}
      {showConfirmExtendGame && (
        <Layer onClickOutside={() => setShowConfirmExtendGame(false)} background="transparent">
          <Box pad="medium" background="light-2" round gap="small">
            <Heading level={3} margin={{ vertical: 'small' }}>
              Extend Game
            </Heading>
            <Text>Are you sure you want to play another inning?</Text>
            <Box direction="row" gap="medium" margin={{ top: 'small' }}>
              <Button
                color="status-critical"
                plain={false}
                label="Cancel"
                onClick={() => setShowConfirmExtendGame(false)}
              />
              <Button
                color="status-ok"
                primary
                plain={false}
                label="Confirm"
                onClick={onClickExtendGame}
              />
            </Box>
          </Box>
        </Layer>
      )}
      <Box align="center">
        <Heading level={2} margin={{ bottom: 'small' }}>
          {winningTeamName} wins!
        </Heading>
        <Heading margin={{ bottom: 'large' }}>
          {awayScore} - {homeScore}
        </Heading>
      </Box>
      <Box gap="medium" style={{ maxWidth: '35%' }}>
        <Box gap="xsmall">
          {!saved && (
            <TextInput
              value={gameName!}
              onChange={handleChangeName}
              placeholder="Title this game"
            />
          )}
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
              onClick={() => (saved ? onClickResetGame() : setShowConfirmNewGame(true))}
            />
            <CheckBox
              toggle
              label="Keep Teams"
              checked={keepTeams}
              onChange={e => setKeepTeams(e.target.checked)}
            />
          </Box>
        </Box>
        {gameLength < maxGameLength && (
          <Button
            color="light-1"
            plain={false}
            disabled={saved}
            label="Play another inning"
            onClick={() => setShowConfirmExtendGame(true)}
          />
        )}
        <DumpReduxStoreButton />
      </Box>
    </Main>
  );
};

export default GameOver;
